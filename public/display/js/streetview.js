/*
** Copyright 2013 Google Inc.
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
**    http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
*/

define(
['config', 'bigl', 'validate', 'stapes', 'googlemaps'],
function(config, L, validate, Stapes, GMaps) {
  var StreetViewModule = Stapes.subclass({

    // street view horizontal field of view per zoom level
    // varies per render mode
    SV_HFOV_TABLES: {
      "webgl": [
        127,
        90,
        53.5,
        28.125,
        14.25
      ],
      "html4": [
        180,
        90,
        45,
        22.5,
        11.25
      ],
      "html5": [
        127,
        90,
        53.5,
        28.125,
        14.25
      ],
      "flash": [
        180,
        90,
        45,
        22.5,
        11.25
      ]
    },

    constructor: function($canvas, master) {
      this.$canvas = $canvas;
      this.master = master;
      this.map = null;
      this.streetview = null;
      this.meta = null;
      this.pov = null;
      this.mode = config.display.mode;
      this.zoom = config.display.zoom;
      this.fov_table = this.SV_HFOV_TABLES[this.mode];
      this.hfov = this.fov_table[this.zoom];
      this.vfov = null;
    },

    // PUBLIC

    // *** init()
    // should be called once when ready to set Maps API into motion
    init: function() {
      console.debug('StreetView: init');

      var self = this;

      // *** ensure success of Maps API load
      if (typeof GMaps === 'undefined') L.error('Maps API not loaded!');

      // *** initial field-of-view
      this._resize();

      // *** create a local streetview query object
      this.sv_svc = new GMaps.StreetViewService();

      // *** options for the map object
      // the map will never be seen, but we can still manipulate the experience
      // with these options.
      var mapOptions = {
        disableDefaultUI: true,
        center: new GMaps.LatLng(45,45),
        backgroundColor: "black",
        zoom: 8
      };

      // *** options for the streetview object
      var svOptions = {
        visible: true,
        disableDefaultUI: true
      };

      // *** only show links on the master display
      if (this.master) {
        svOptions.linksControl = true;
      }

      // *** init map object
      this.map = new GMaps.Map(
        this.$canvas,
        mapOptions
      );

      // *** init streetview object
      this.streetview = new GMaps.StreetViewPanorama(
        this.$canvas,
        svOptions
      );

      // *** init streetview pov
      this.streetview.setPov({
        heading: 0,
        pitch: 0,
        zoom: this.zoom
      });

      // *** set the display mode as specified in global configuration
      this.streetview.setOptions({ mode: this.mode });

      // *** apply the custom streetview object to the map
      this.map.setStreetView( this.streetview );

      // *** events for master only
      if (this.master) {
        // *** handle view change events from the streetview object
        GMaps.event.addListener(this.streetview, 'pov_changed', function() {
          var pov = self.streetview.getPov();

          self._broadcastPov(pov);
          self.pov = pov;
        });

        // *** handle pano change events from the streetview object
        GMaps.event.addListener(this.streetview, 'pano_changed', function() {
          var panoid = self.streetview.getPano();

          if (panoid != self.pano) {
            self._broadcastPano(panoid);
            self.pano = panoid;
          }
        });
      }

      // *** disable <a> tags at the bottom of the canvas
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        var links = self.$canvas.getElementsByTagName("a");
        var len = links.length;
        for (var i = 0; i < len; i++) {
          links[i].style.display = 'none';
          links[i].onclick = function() {return(false);};
        }
      });

      // *** request the last known state from the server
      this.on('ready', function() {
        self.emit('refresh');
      });

      // *** wait for an idle event before reporting module readiness
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        console.debug('StreetView: ready');
        self.emit('ready');
      });

      // *** handle window resizing
      window.addEventListener('resize',  function() {
        self._resize();
      });
    },

    // *** setPano(panoid)
    // switch to the provided pano, immediately
    setPano: function(panoid) {
      if (!validate.panoid(panoid)) {
        L.error('StreetView: bad panoid to setPano!');
        return;
      }

      if (panoid != this.streetview.getPano()) {
        this.pano = panoid;
        this.streetview.setPano(panoid);
      } else {
        console.warn('StreetView: ignoring redundant setPano');
      }
    },

    // *** setPov(GMaps.StreetViewPov)
    // set the view to the provided pov, immediately
    setPov: function(pov) {
      if (!validate.number(pov.heading) || !validate.number(pov.pitch)) {
        L.error('StreetView: bad pov to setPov!');
        return;
      }

      this.streetview.setPov(pov);
    },

    // *** setHdg(heading)
    // set just the heading of the POV, zero the pitch
    setHdg: function(heading) {
      if (!validate.number(heading)) {
        L.error('StreetView: bad heading to setHdg!');
        return;
      }

      this.setPov({ heading: heading, pitch: 0 });
    },

    // *** translatePov({yaw, pitch})
    // translate the view by a relative pov
    translatePov: function(abs) {
      if (!validate.number(abs.yaw) || !validate.number(abs.pitch)) {
        L.error('StreetView: bad abs to translatePov!');
        return;
      }

      var pov = this.streetview.getPov();

      pov.heading += abs.yaw;
      pov.pitch   += abs.pitch;

      this.streetview.setPov(pov);
    },

    // *** moveForward()
    // move to the pano nearest the current heading
    moveForward: function() {
      console.log('moving forward');
      var forward = this._getForwardLink();
      if(forward) {
        this.setPano(forward.pano);
        this._broadcastPano(forward.pano);
      } else {
        console.log("can't move forward, no links!");
      }
    },

    // PRIVATE

    // *** _resize()
    // called when the canvas size has changed
    _resize: function() {
      var screenratio = window.innerHeight / window.innerWidth;
      this.vfov = this.hfov * screenratio;
      this.emit('size_changed', {hfov: this.hfov, vfov: this.vfov});
      console.debug('StreetView: resize', this.hfov, this.vfov);
    },

    // *** _broadcastPov(GMaps.StreetViewPov)
    // report a pov change to listeners
    _broadcastPov: function(pov) {
      this.emit('pov_changed', pov);
    },

    // *** _broadcastPano(panoid)
    // report a pano change to listeners
    _broadcastPano: function(panoid) {
      this.emit('pano_changed', panoid);
    },

    // *** _getLinkDifference(
    //                         GMaps.StreetViewPov,
    //                         GMaps.StreetViewLink
    //                       )
    // return the difference between the current heading and the provided link
    _getLinkDifference: function(pov, link) {
      var pov_heading = pov.heading;
      var link_heading = link.heading;

      var diff = Math.abs(link_heading - pov_heading) % 360;

      return diff >= 180 ? diff - (diff - 180) * 2 : diff;
    },

    // *** _getForwardLink()
    // return the link nearest the current heading
    _getForwardLink: function() {
      var pov = this.streetview.getPov();
      var links = this.streetview.getLinks();
      var len = links.length;
      var nearest = null;
      var nearest_difference = 360;

      for(var i=0; i<len; i++) {
        var link = links[i];
        var difference = this._getLinkDifference(pov, link);
        console.log(difference, link);
        if (difference < nearest_difference) {
          nearest = link;
          nearest_difference = difference;
        }
      }

      return nearest;
    }
  });

  return StreetViewModule;
});

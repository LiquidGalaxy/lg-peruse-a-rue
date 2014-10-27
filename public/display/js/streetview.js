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

    constructor: function($canvas, opts) { // Alf
      this.$canvas = $canvas;
      this.master = opts.master;
      this.rotate = opts.rotate; // Alf rotate monitor or not
      this.map = null;
      this.streetview = null;
      this.meta = null;
      this.pov = null;
      this.mode = config.display.mode;
      //Alf this.zoom = config.display.zoom;
      //Alf this.fov_table = this.SV_HFOV_TABLES[this.mode];
      this.vfov = null;
      //Alf this.hfov = this.fov_table[this.zoom];
      this.hfov = config.display.hfov; // start Alf
      this.yawoffset = opts.yawoffset;
      this.bezel = config.display.bezel;
      this.maxPitch = config.display.maxPitch;
      this.yawRads = 0;
    },

    // PUBLIC

    // *** init()
    // should be called once when ready to set Maps API into motion
    init: function() {
      console.debug('StreetView: init');

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
        scrollwheel: false, // Alf not needed on slaves
        visible: true,
        disableDefaultUI: true
      };

      // *** only show links on the master or center display
      if (this.master || this.yawoffset == 0) { // Alf
        svOptions.linksControl = true;
      }

      // *** init map object
      this.map = new GMaps.Map(
        this.$canvas,
        mapOptions
      );

     // Alf add markers - start
     var latlng1 = new GMaps.LatLng(-33.614589,150.747138);
     var icon1 = 'http://eresearch.uws.edu.au/public/wonderama/HAC1.png';
     var image1 = new GMaps.Marker({ position: latlng1, map: this.map, icon: icon1 });
     var latlng2 = new GMaps.LatLng(-33.615589,150.748138);
     var icon2 = 'http://eresearch.uws.edu.au/public/wonderama/HAC2.png';
     var image2 = new GMaps.Marker({ position: latlng2, map: this.map, icon: icon2 });
     var latlng3 = new GMaps.LatLng(-33.616589,150.749138);
     var icon3 = 'http://eresearch.uws.edu.au/public/wonderama/HAC3.png';
     var image3 = new GMaps.Marker({ position: latlng3, map: this.map, icon: icon3 });
     var latlng4 = new GMaps.LatLng(-33.617589,150.749138);
     var icon4 = 'http://eresearch.uws.edu.au/public/wonderama/HAC4.png';
     var image4 = new GMaps.Marker({ position: latlng4, map: this.map, icon: icon4 });
        //console.debug('Marker code ran');
     // Alf add markers - end

      // *** init streetview object
      /* Alf this.streetview = new GMaps.StreetViewPanorama(
        this.$canvas,
        svOptions
      ); */
	this.streetview = this.map.getStreetView();
	this.streetview.setOptions(svOptions);
	this.streetview.setVisible(true);

      // *** init streetview pov
      this.streetview.setPov({
        heading: 0,
        pitch: 0,
        // Alf zoom: this.zoom
	zoom: this.fovToZoom( this.hfov ) // Alf
      });

      //console.log("Zoom hfov:"+this.hfov+" zoom:"+this.fovToZoom(this.hfov));

      // *** set the display mode as specified in global configuration
      this.streetview.setOptions({ mode: this.mode });

      // *** apply the custom streetview object to the map
      this.map.setStreetView( this.streetview );

      this.yawRads = -this.yawoffset * this.hfov * this.bezel * Math.PI/180; // Alf

      // *** events for master only
      if (this.master) {
        // *** handle view change events from the streetview object
        GMaps.event.addListener(this.streetview, 'pov_changed', function() {
          var pov = this.streetview.getPov();

		console.log("pov_changed event broadcast"); //Alf 
	/* Alf master roll stuff */
	var svContainerElement = null;
         svContainerElement = document.getElementById("svContainer");
	//var roll = 10; // getPhotographPov(tilt)-heading
	var svpov = this.streetview.getPhotographerPov();
	//svpov.pitch = 0.0;
	var viewdiff = svpov.heading - pov.heading;
	//if (viewdiff > 180) { viewdiff -= 180;}
	//if (viewdiff < -180) { viewdiff += 180;}
	var roll = svpov.pitch * Math.sin(viewdiff*Math.PI/180);
	console.log('master viewdiff:'+viewdiff+' roll:'+roll);

          //this._broadcastPov(pov); // Added roll to broadcast
          this._broadcastPov({ heading:pov.heading, pitch:pov.pitch, zoom:pov.zoom, roll:-roll}); // Added roll to broadcast
          //this._broadcastPov({ heading:pov.heading, pitch:pov.pitch, zoom:pov.zoom, roll:0}); // Added roll to broadcast
          this.pov = pov;

     svContainerElement.setAttribute("style","transform: rotate(" + roll + "deg);-webkit-transform: rotate(" + roll + "deg)");
      console.log('master roll:' + roll + ' viewhdg:'+pov.heading + ' campitch:' + svpov.pitch + ' camhdg:'+ svpov.heading);
        }.bind(this));

        // *** handle pano change events from the streetview object
        GMaps.event.addListener(this.streetview, 'pano_changed', function() {
          var panoid = this.streetview.getPano();

          if (panoid != this.pano) {
            this._broadcastPano(panoid);
            this.pano = panoid;
          }
        }.bind(this));
      }

      // *** disable <a> tags at the bottom of the canvas
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        var links = this.getElementsByTagName("a");
        var len = links.length;
        for (var i = 0; i < len; i++) {
          links[i].style.display = 'none';
          links[i].onclick = function() {return(false);};
        }

      }.bind(this.$canvas));

      // *** request the last known state from the server
      this.on('ready', function() {
        this.emit('refresh');
      }.bind(this));

      // *** wait for an idle event before reporting module readiness
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        console.debug('StreetView: ready');
        this.emit('ready');
      }.bind(this));

      // *** handle window resizing
      window.addEventListener('resize',  function() {
        this._resize();
      }.bind(this));

    },

    // start Alf - this is pretty crappy via wolframalpha
    fovToZoom: function(fov) { // fov > zoom conversion
        //Alf 20131207 fov = fov * 1.42; // Alf fecking fudge
	fov = fov *1.42;

        //if (this.master) { fov = fov * 1080/1620; } //slaves are "zoomed" because of CSS canvas, adjust zoom on master to compensate

        var zoom = -3.32969 *10E-7 * Math.pow(fov,3) + 0.000869466 * Math.pow(fov,2) - 0.0976644 * fov + 5.19578; // html5 or webgl
        console.debug("fTZ fov:"+ fov + " zoom:" + zoom );
        return zoom;
    }, // end Alf


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
     	/* Alf code to look at a fixed latlng
	var somewhere = new google.maps.LatLng( -33.60958, 150.73777);
	var newhdg = google.maps.geometry.spherical.computeHeading( this.streetview.getPosition(), somewhere);
	console.log("setPano: newhdg="+newhdg);
     	this.streetview.setPov( {heading:newhdg, pitch:0} ); // always throw new pano north
	*/
      } else {
        console.warn('StreetView: ignoring redundant setPano');
      }
    },

    // *** setPov(GMaps.StreetViewPov)
    // set the view to the provided pov, immediately
    setPov: function(pov) {
      if (!validate.number(pov.heading) || !validate.number(pov.pitch)) {
        L.error('StreetView: bad pov sent to setPov!');
        return;
      }
      if (!validate.number(pov.roll)) { //Alf added roll validate check
        L.error('StreetView: bad roll sent to setPov! roll='+pov.roll);
        return;
      }

	
// Alf should do a fix360 on heading

     console.log("in streetview.setPov pov.heading:"+pov.heading+ " pov.pitch:"+pov.pitch + 'pov.roll:'+pov.roll);
      if (this.master) {
     this.streetview.setPov( pov );
	console.log("does setPov ever fire on the master?");
	/* Alf var svContainerElement = null;
         svContainerElement = document.getElementById("svContainer");
	//var pov.roll = - (pov.heading/10 - 5);
     svContainerElement.setAttribute("style","transform: rotate(" + roll + "deg);-webkit-transform: rotate(" + roll + "deg)");
      console.log('svC: setPov roll:' + roll + ' hdg:'+pov.heading); */

	} else { // for html5 do pitch rolls

      // start Alf
      //orig var svContainerElement = document.getElementById("svLContainer");

	var svContainerElement = null;
     if (this.rotate == 1) {
         svContainerElement = document.getElementById("svContainer");
     } else {
         svContainerElement = document.getElementById("svLContainer");
     }

     //var htr = [ pov.heading, pov.pitch, 0 ]; // heading,pitch,roll from master
     var htr = [ pov.heading, pov.pitch, pov.roll ]; // heading,pitch,roll from master
     var transform = M33.headingTiltRollToLocalOrientationMatrix( htr );
     transform[0] = V3.rotate(transform[0], transform[2], this.yawRads);
     transform[1] = V3.rotate(transform[1], transform[2], this.yawRads);
     var slaveHTR =  M33.localOrientationMatrixToHeadingTiltRoll( transform );

	// heading = slaveHTR[0], pitch = slaveHTR[1], roll = slaveHTR[2]
     // this.streetview.setPov({ heading:slaveHTR[0], pitch:slaveHTR[1], zoom:pov.zoom });
     this.streetview.setPov({ heading:slaveHTR[0], pitch:slaveHTR[1] }); // don't copy zoom

     var slaveRoll = -slaveHTR[2];

     svContainerElement.setAttribute("style","transform: rotate(" + slaveRoll + "deg);-webkit-transform: rotate(" + slaveRoll + "deg)");

      console.log('svC: setPov slaveRoll:' + slaveRoll + ' hdg:'+pov.heading+ ' slhdg:'+slaveHTR[0]);
 // end Alf
	}
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
      //console.log('translatePov pov.heading:'+pov.heading+ ' pov.pitch:'+pov.pitch);

      pov.heading += abs.yaw / 2;// start Alf - slow down yaw
      pov.pitch   += abs.pitch / 5; // slow down pitch

      if (pov.pitch > this.maxPitch) {
          pov.pitch = this.maxPitch;
      } else if (pov.pitch < -this.maxPitch) {
          pov.pitch = -this.maxPitch;
      } // end Alf

	// console.log('translatePov pov.hdg:'+pov.heading+' pov.pitch:'+pov.pitch+ 'pov.zoom:'+pov.zoom);
      this.streetview.setPov(pov);
      // console.log('svC: translatePov'); // Alf
    },

    // *** moveForward()
    // move to the pano nearest the current heading
    moveForward: function() {
      // console.log('moving forward');
      var forward = this._getForwardLink();
      if(forward) {
        this.setPano(forward.pano);
        this._broadcastPano(forward.pano);
      } else {
        console.log("can't move forward, no links!");
      }
    },

    // *** moveBackward() // start Alf
    // move to the pano farest from the current heading
    moveBackward: function() {
      //console.log('moving backward');
      var backward = this._getBackwardsLink();
      if(backward) {
        this.setPano(backward.pano);
        this._broadcastPano(backward.pano);
      } else {
        console.log("can't move backward, no links!");
      }
    }, // end Alf


    // PRIVATE

    // *** _resize()
    // called when the canvas size has changed
    _resize: function() {
      var screenratio = window.innerHeight / window.innerWidth;
      this.vfov = this.hfov * screenratio;
      this.emit('size_changed', {hfov: this.hfov, vfov: this.vfov});
      console.debug('StreetView: resize hfov:'+ this.hfov + ' vfov:'+ this.vfov);
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

      var diff = link_heading - pov_heading;
      diff = Math.abs((diff + 180) % 360 - 180);

      return diff;
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
        //Alf console.log(difference, link);
        if (difference < nearest_difference) {
          nearest = link;
          nearest_difference = difference;
        }
      }

      return nearest;
    }, // start Alf

    // *** _getBackwardsLink() // start Alf
    // return the link nearest the current heading
    _getBackwardsLink: function() {
      var pov = this.streetview.getPov();
      var links = this.streetview.getLinks();
      var len = links.length;
      var farest = null;
      var farest_difference = 0;

      for(var i=0; i<len; i++) {
        var link = links[i];
        var difference = this._getLinkDifference(pov, link);
        // Alf console.log(difference, link);
        if (difference > farest_difference) {
          farest = link;
          farest_difference = difference;
        }
      }

      return farest;
    } // end Alf

  });

  return StreetViewModule;
});

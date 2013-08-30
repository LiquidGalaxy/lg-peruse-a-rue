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
['config', 'bigl', 'stapes', 'mapstyle', 'googlemaps'],
function(config, L, Stapes, PeruseMapStyles, GMaps) {

  var MapModule = Stapes.subclass({
    click_search_radius: 250,

    constructor: function($canvas) {
      this.$canvas = $canvas;
      this.map = null;
      this.sv_marker = null;
    },

    init: function() {
      console.debug('Map: init');

      if (typeof GMaps === 'undefined') L.error('Maps API not loaded!');

      this.sv_svc = new GMaps.StreetViewService();
      this.default_center = new GMaps.LatLng(
        config.touchscreen.default_center[0],
        config.touchscreen.default_center[1]
      );

      // use the improved visuals from the maps preview
      GMaps.visualRefresh = true;

      var mapOptions = {
        backgroundColor: "black",
        center: this.default_center,
        zoom: 14,
        disableDefaultUI: true,
        mapTypeId: GMaps.MapTypeId.HYBRID
      };

      this.map = new GMaps.Map(
        this.$canvas,
        mapOptions
      );

      this.map.setOptions({styles: PeruseMapStyles});

      // disable all <a> tags on the map canvas
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        var links = this.getElementsByTagName("a");
        var len = links.length;
        for (var i = 0; i < len; i++) {
          links[i].style.display = 'none';
          links[i].onclick = function() {return(false);};
        }
      }.bind(this.$canvas));

      // initialize the marker indicating the current sv location
      this.sv_marker = new GMaps.Marker({
        position: this.default_center,
        title: 'Street View',
        icon: 'icons/sv_sprite.png',
        clickable: false
      });

      // allow user to click on a street to load it in street view
      GMaps.event.addListener(this.map, 'click', function(event) {
        this.sv_svc.getPanoramaByLocation(
          event.latLng,
          this.click_search_radius,
          function(data, stat) {
            if(stat == GMaps.StreetViewStatus.OK) {
              var latlng = data.location.latLng;
              var panoid = data.location.pano;

              this._broadcast_pano(panoid);
              this._pan_map(latlng);
              this._move_sv_marker(latlng);
            } else {
              console.debug('Map: could not find pano');
            }
          }.bind(this)
        );
      }.bind(this));

      // signal that the map is ready
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        console.debug('Map: ready');
        this.emit('ready');
      }.bind(this));
    },

    zoom_in: function() {
      this.map.setZoom(this.map.getZoom() + 1);
    },

    zoom_out: function() {
      this.map.setZoom(this.map.getZoom() - 1);
    },

    _pan_map: function(latlng) {
      this.map.panTo(latlng);
    },

    _move_sv_marker: function(latlng) {
      this.sv_marker.setMap(this.map);
      this.sv_marker.setPosition(latlng);
    },

    _hide_sv_marker: function() {
      this.sv_marker.setMap(null);
    },

    _broadcast_pano: function(panoid) {
      this.emit('pano', panoid);
    },

    _select_pano_cb: function(data, stat) {
      if(stat == GMaps.StreetViewStatus.OK) {
        var latlng = data.location.latLng;
        var panoid = data.location.pano;

        this._broadcast_pano(panoid);
        this._pan_map(latlng);
        this._hide_sv_marker();
      } else {
        L.error('Map: select query failed!');
      }
    },

    // select is called when the streetview location is selected from the local
    // interface (poi).  it should pan the map, move the marker, and broadcast
    // the location to displays.
    select_pano_by_id: function(panoid) {
      this.sv_svc.getPanoramaById(
        panoid,
        this._select_pano_cb.bind(this)
      );
    },

    _update_pano_cb: function(data, stat) {
      if(stat == GMaps.StreetViewStatus.OK) {
        var latlng = data.location.latLng;
        var panoid = data.location.pano;

        this._pan_map(latlng);
        this._move_sv_marker(latlng);
      } else {
        L.error('Map: update query failed!');
      }
    },

    // update is called when the streetview location is changed by display
    // clients.  it should pan the map and move the marker to the new location.
    update_pano_by_id: function(panoid) {
      this.sv_svc.getPanoramaById(
        panoid,
        this._update_pano_cb.bind(this)
      );
    },

    _add_marker_click_event: function(marker, latlng, panoid) {
      GMaps.event.addListener(marker, 'click', function(mev) {
        this._broadcast_pano(panoid);
        this._pan_map(latlng);
        this._hide_sv_marker();
      }.bind(this));
    },

    _add_location_marker: function(panoid, name, latlng) {
      var marker = new GMaps.Marker({
        position  : latlng,
        title     : name,
        clickable : true,
        map       : this.map
      });

      this._add_marker_click_event(marker, latlng, panoid);
    },

    _location_cb: function(data, stat) {
      if(stat == GMaps.StreetViewStatus.OK) {
        var latlng = data.location.latLng;
        var name   = data.location.description;
        var panoid = data.location.pano;

        this._add_location_marker(panoid, name, latlng);
      } else {
        L.error('Map: location query failed!');
      }
    },

    add_location_by_id: function(panoid) {
      this.sv_svc.getPanoramaById(
        panoid,
        this._location_cb.bind(this)
      );
    }
  });

  return MapModule;
});

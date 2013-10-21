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
['config', 'bigl', 'stapes', 'mapstyle', 'googlemaps', 'sv_svc'],
function(config, L, Stapes, PeruseMapStyles, GMaps, sv_svc) {

  var MIN_COVERAGE_ZOOM_LEVEL = 14;
  var SEARCH_FAIL_BALLOON_TIME = 1100;

  var MapModule = Stapes.subclass({
    constructor: function($canvas) {
      this.$canvas = $canvas;
      this.map = null;
      this.sv_marker = null;
    },

    init: function() {
      console.debug('Map: init');

      if (typeof GMaps === 'undefined') L.error('Maps API not loaded!');

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
        mapTypeControl: true,
        mapTypeControlOptions: {
          mapTypeIds: [ GMaps.MapTypeId.ROADMAP, GMaps.MapTypeId.HYBRID ]
        },
        mapTypeId: GMaps.MapTypeId.ROADMAP
      };

      this.map = new GMaps.Map(
        this.$canvas,
        mapOptions
      );

      this.map.setOptions({styles: PeruseMapStyles});

      // instantiate street view coverage layer
      this.sv_coverage_layer = new GMaps.StreetViewCoverageLayer();

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

      // initialize the balloon indicating a pano could not be found
      this.search_fail_balloon = new GMaps.InfoWindow({
        content: '<img src="icons/sv_fail.png" height="40" width="40" />',
        disableAutoPan: true
      });
      this.balloon_close_timeout = null;

      // enable/disable map coverage layer based on zoom level
      GMaps.event.addListener(this.map, 'zoom_changed', function(event) {
        if (this.map.getZoom() >= MIN_COVERAGE_ZOOM_LEVEL)
          this._show_coverage_layer();
        else
          this._hide_coverage_layer();
      }.bind(this));

      // allow user to click on a street to load it in street view
      GMaps.event.addListener(this.map, 'click', function(event) {
        // determine min/max search radius based on zoom level
        var min_search_radius;
        var max_search_radius;

        var current_zoom = this.map.getZoom();

        if (current_zoom <= 10) {
          min_search_radius = 400;
          max_search_radius = 1600;
        } else if (current_zoom <= 12) {
          min_search_radius = 100;
          max_search_radius = 400;
        } else if (current_zoom <= 14) {
          min_search_radius = 50;
          max_search_radius = 200;
        } else {
          min_search_radius = 50;
          max_search_radius = 50;
        }

        sv_svc.getPanoramaByLocation(
          event.latLng,
          min_search_radius,
          function(data, stat, search_latlng) {
            if(stat == GMaps.StreetViewStatus.OK) {
              var latlng = data.location.latLng;
              var panoid = data.location.pano;

              this._broadcast_pano(panoid);
              this._pan_map(latlng);
              this._move_sv_marker(latlng);
              this._close_search_fail_balloon();
            } else {
              console.debug('Map: could not find pano');
              this._open_search_fail_balloon(search_latlng);
            }
          }.bind(this),
          max_search_radius
        );
      }.bind(this));

      // signal that the map is ready
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        // trigger a zoom change
        GMaps.event.trigger(this.map, 'zoom_changed');

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

    _open_search_fail_balloon: function(latlng) {
      this._close_search_fail_balloon();
      this.search_fail_balloon.setPosition(latlng);
      this.search_fail_balloon.open(this.map);
      this.balloon_close_timeout = setTimeout(
        this._close_search_fail_balloon.bind(this),
        SEARCH_FAIL_BALLOON_TIME
      );
    },

    _close_search_fail_balloon: function() {
      clearTimeout(this.balloon_close_timeout);
      this.search_fail_balloon.close();
    },

    _show_coverage_layer: function() {
      this.sv_coverage_layer.setMap(this.map);
    },

    _hide_coverage_layer: function() {
      this.sv_coverage_layer.setMap(null);
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
      sv_svc.getPanoramaById(
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
      sv_svc.getPanoramaById(
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
      sv_svc.getPanoramaById(
        panoid,
        this._location_cb.bind(this)
      );
    }
  });

  return MapModule;
});

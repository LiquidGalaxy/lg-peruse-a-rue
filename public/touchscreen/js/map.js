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
[
  'config', 'bigl', 'stapes', 'mapstyle', 'googlemaps', 'sv_svc',
  // map submodules
  'map/coverage', 'map/svmarker', 'map/clicksearch', 'map/poimarkers',
  'map/earthpos'
],
function(
  config, L, Stapes, PeruseMapStyles, GMaps, sv_svc,
  // map submodules
  SVCoverageModule, SVMarkerModule, ClickSearchModule, POIMarkerModule,
  EarthPosModule
) {

  var MapModule = Stapes.subclass({
    constructor: function($canvas) {
      this.$canvas = $canvas;
      this.map = null;
    },

    init: function() {
      console.debug('Map: init');

      var self = this;

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
        mapTypeControl: config.touchscreen.show_maptypectl,
        mapTypeControlOptions: {
          mapTypeIds: [ GMaps.MapTypeId.ROADMAP, GMaps.MapTypeId.HYBRID ],
          position: GMaps.ControlPosition.TOP_LEFT
        },
        mapTypeId: GMaps.MapTypeId[config.touchscreen.default_maptype]
      };

      this.map = new GMaps.Map(
        this.$canvas,
        mapOptions
      );

      this.map.setOptions({styles: PeruseMapStyles});

      // instantiate map modules
      this.sv_coverage = new SVCoverageModule(this.map);
      this.sv_marker = new SVMarkerModule(this.map);
      this.poi_markers = new POIMarkerModule(this.map);
      this.click_search = new ClickSearchModule(this.map);
      this.earth_pos = new EarthPosModule(this.map);

      // handler for marker clicks
      this.poi_markers.on('marker_selected', function(panodata) {
        var latlng = panodata.location.latLng;
        var panoid = panodata.location.pano;

        self._broadcast_pano(panoid);
        self._pan_map(latlng);
        self.sv_marker.hide();
      });

      // handler for click search result
      this.click_search.on('search_result', function(panodata) {
        var latlng = panodata.location.latLng;
        var panoid = panodata.location.pano;

        self._broadcast_pano(panoid);
        self._pan_map(latlng);
        self.sv_marker.move(latlng);
      });

      // handler for earth position report
      this.earth_pos.on('found_location', function(panodata) {
        var latlng = panodata.location.latLng;
        var panoid = panodata.location.pano;

        self._broadcast_pano(panoid);
        self._pan_map(latlng);
        self.sv_marker.move(latlng);
      });

      // disable all <a> tags on the map canvas
      GMaps.event.addListener(this.map, 'idle', function() {
        var links = self.$canvas.getElementsByTagName("a");
        var len = links.length;
        for (var i = 0; i < len; i++) {
          links[i].style.display = 'none';
          links[i].onclick = function() {return(false);};
        }
      });

      // signal that the map is ready
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        console.debug('Map: ready');
        self.emit('ready');
      });
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

    _broadcast_pano: function(panoid) {
      this.emit('pano', panoid);

      var self = this;
      sv_svc.getPanoramaById(
        panoid,
        function (data, stat) {
          if (stat == GMaps.StreetViewStatus.OK) {
            sv_svc.serializePanoData(data);
            self.emit('meta', data);
          }
        }
      );
    },

    add_location_by_id: function(panoid) {
      this.poi_markers.add_location_by_id(panoid);
    },

    // select is called when the streetview location is selected from the local
    // interface (poi).  it should pan the map, move the marker, and broadcast
    // the location to displays.
    select_pano_by_id: function(panoid) {
      var self = this;

      sv_svc.getPanoramaById(
        panoid,
        function (data, stat) {
          if(stat == GMaps.StreetViewStatus.OK) {
            var result_latlng = data.location.latLng;
            var result_panoid = data.location.pano;

            self._broadcast_pano(result_panoid);
            self._pan_map(result_latlng);
            self.sv_marker.hide();
          } else {
            L.error('Map: select query failed!');
          }
        }
      );
    },

    // update is called when the streetview location is changed by display
    // clients.  it should pan the map and move the marker to the new location.
    update_pano_by_id: function(panoid) {
      var self = this;

      sv_svc.getPanoramaById(
        panoid,
        function (data, stat) {
          if(stat == GMaps.StreetViewStatus.OK) {
            var result_latlng = data.location.latLng;
            var result_panoid = data.location.pano;

            self._pan_map(result_latlng);
            self.sv_marker.move(result_latlng);
          } else {
            L.error('Map: update query failed!');
          }
        }
      );
    },
  });

  return MapModule;
});

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
['config', 'bigl', 'stapes', 'googlemaps'],
function(config, L, Stapes, GMaps) {

  var MIN_COVERAGE_ZOOM_LEVEL = 14;

  var SVCoverageModule = Stapes.subclass({
    constructor: function(map) {
      var self = this;

      this.map = map;

      // instantiate street view coverage layer
      this.sv_coverage_layer = new GMaps.StreetViewCoverageLayer();

      // enable/disable map coverage layer based on zoom level
      GMaps.event.addListener(this.map, 'zoom_changed', function(event) {
        if (self.map.getZoom() >= MIN_COVERAGE_ZOOM_LEVEL)
          self._show_coverage_layer();
        else
          self._hide_coverage_layer();
      });

      // signal that the map is ready
      GMaps.event.addListenerOnce(this.map, 'idle', function() {
        // trigger a zoom change
        GMaps.event.trigger(self.map, 'zoom_changed');
      });
    },

    _show_coverage_layer: function() {
      this.sv_coverage_layer.setMap(this.map);
    },

    _hide_coverage_layer: function() {
      this.sv_coverage_layer.setMap(null);
    },
  });

  return SVCoverageModule;
});

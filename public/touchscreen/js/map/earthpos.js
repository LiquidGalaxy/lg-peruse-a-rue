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
['config', 'bigl', 'stapes', 'googlemaps', 'sv_svc', 'jquery'],
function(config, L, Stapes, GMaps, sv_svc, $) {

  var MIN_SEARCH_RADIUS = 200;
  var MAX_SEARCH_RADIUS = 3200;

  var EarthPosModule = Stapes.subclass({
    constructor: function(map) {
      var self = this;

      this.map = map;

      GMaps.event.addListenerOnce(this.map, 'idle', function(event) {
        if (config.earth_pos_url) {
          var ajax_opts = {
            async: true,
            cache: false,
            dataType: 'json',

            success: function(data) {
              var ll = new GMaps.LatLng(data['cameraLat'], data['cameraLon']);
              sv_svc.getPanoramaByLocation(
                ll,
                MIN_SEARCH_RADIUS,
                self.searchCB.bind(self),
                MAX_SEARCH_RADIUS
              );
            },

            error: function(jqXHR, textStatus, errorThrown) {
              console.warn('Error fetching Earth posiition:', errorThrown);
            }
          };

          $.ajax(
            config.earth_pos_url,
            ajax_opts
          );
        }
      });
    },

    searchCB: function(panodata, stat) {
      if (stat == GMaps.StreetViewStatus.OK) {
        this.emit('found_location', panodata);
      }
    }
  });

  return EarthPosModule;
});

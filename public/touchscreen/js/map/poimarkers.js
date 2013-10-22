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
['config', 'bigl', 'stapes', 'googlemaps', 'sv_svc'],
function(config, L, Stapes, GMaps, sv_svc) {

  var ClickSearchModule = Stapes.subclass({
    constructor: function(map) {
      this.map = map;
    },

    _add_location_marker: function(panodata) {
      var latlng = panodata.location.latLng;
      var name   = panodata.location.description;
      var panoid = panodata.location.pano;

      var marker = new GMaps.Marker({
        position  : latlng,
        title     : name,
        clickable : true,
        map       : this.map
      });

      GMaps.event.addListener(marker, 'click', function(mev) {
        this.emit('marker_selected', panodata);
      }.bind(this));
    },

    add_location_by_id: function(panoid) {
      sv_svc.getPanoramaById(
        panoid,
        function (panodata, stat) {
          if(stat == GMaps.StreetViewStatus.OK) {
            this._add_location_marker(panodata);
          } else {
            L.error('POIMarker: location query failed!');
          }
        }.bind(this)
      );
    }
  });

  return ClickSearchModule;
});

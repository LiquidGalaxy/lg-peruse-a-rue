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
['config', 'bigl', 'stapes', 'googlemaps', 'jquery', 'jsKeyboard', 'leftui', 'doT'],
function(config, L, Stapes, GMaps, $, jsKeyboard, leftUI, doT) {

  var KeyboardSearchModule = Stapes.subclass({
    constructor: function(map) {
      var self = this;

      this.map = map;

      this.template = doT.template(document.getElementById('search-template').innerHTML);
      this.search_div = this.template();

      leftUI.append(this.search_div);
      // clear input when search tab is closed
      leftUI.addOpenListener(function() {
        self.clearInput();
      });

      this.markers = [];

      this.input = document.getElementById('keyboardEntry');

      this.place_svc = new GMaps.places.PlacesService(this.map);

      jsKeyboard.init('virtual-keyboard');
      var field = $(this.input);
      field.focus();
      jsKeyboard.currentElement = field;
      jsKeyboard.currentElementCursorPosition = 0;

      $(".key_enter").click(function(e) {
        self._search(self.input.value);
      });
    },

    clearInput: function() {
      this.input.value = "";
    },

    _search: function(query) {
      var self = this;

      if (query == "") {
        console.warn('KeyboardSearch: empty query');
        return;
      }

      var request = {
        query: query,
        bounds: this.map.getBounds()
      };

      this.place_svc.textSearch(
        request,
        function(results, status) {
          if (status == GMaps.places.PlacesServiceStatus.OK) {
            self._searchOK(results);
          } else {
            self._searchFAIL();
          }
        }
      );
    },

    _searchOK: function(places) {
      var bounds = new GMaps.LatLngBounds();

      for (var i = 0, marker; marker = this.markers[i]; i++) {
        marker.setMap(null);
      }
      this.markers = [];

      for (var i = 0, place; place = places[i]; i++) {
        var image = {
          url: place.icon,
          size: new GMaps.Size(71, 71),
          origin: new GMaps.Point(0, 0),
          anchor: new GMaps.Point(17, 34),
          scaledSize: new GMaps.Size(25, 25)
        };

        // Create a marker for each place.
        var marker = new GMaps.Marker({
          map: this.map,
          icon: image,
          title: place.name,
          position: place.geometry.location
        });

        this.markers.push(marker);

        bounds.extend(place.geometry.location);
      }

      this.map.setBounds(bounds);
    },

    _searchFAIL: function() {
      console.warn('KeyboardSearch: search failed');
    }
  });

  return KeyboardSearchModule;
});

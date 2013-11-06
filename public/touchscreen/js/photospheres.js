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
['config', 'bigl', 'stapes', 'jquery'],
function(config, L, Stapes, $) {

  // static url for photosphere content, for now
  var CONTENT_URL = 'http://maps.google.com/cbk?cb_client=maps_sv.gallery&output=polygon&it=11%3A200&polygon=74.706779%2C171.914063%2C74.706779%2C128.935547%2C74.706779%2C85.957031%2C74.706779%2C42.978516%2C74.706779%2C0%2C74.706779%2C-42.978516%2C74.706779%2C-85.957031%2C74.706779%2C-128.935547%2C74.706779%2C-171.914062%2C-55.923887%2C-171.914062%2C-55.923887%2C-128.935547%2C-55.923887%2C-85.957031%2C-55.923887%2C-42.978516%2C-55.923887%2C0%2C-55.923887%2C42.978516%2C-55.923887%2C85.957031%2C-55.923887%2C128.935547%2C-55.923887%2C171.914063';

  var PhotoSpheresModule = Stapes.subclass({
    init: function() {
      if (!config.touchscreen.show_photospheres) {
        console.debug('Photospheres: disabled by config');
        return;
      }

      var self = this;

      $(document).ready(function() {
        $.getJSON(self._get_content_url(), function(photospheres) {
          $.each(photospheres.result, function(key, val) {
            self._add_photosphere(val);
          });
        });
      });
    },

    _add_photosphere: function(photosphere) {
      this.emit('add_location', photosphere.id);
    },

    _get_content_url: function() {
      return CONTENT_URL;
    }
  });

  return PhotoSpheresModule;
});

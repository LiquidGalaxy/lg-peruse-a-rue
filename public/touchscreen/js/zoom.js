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

  var ZoomModule = Stapes.subclass({
    constructor: function() {
      var self = this;

      this.$zoom_box = $('<div></div>')
                       .attr('id', 'zoom-control-box');

      this.$zoom_in = $('<div></div>')
                      .attr('id', 'zoom-in')
                      .addClass('zoom-control-button')
                      .html('+');

      this.$zoom_out = $('<div></div>')
                       .attr('id', 'zoom-out')
                       .addClass('zoom-control-button')
                       .html('&#8211;');

      this.$zoom_box.append(this.$zoom_out).append(this.$zoom_in);
      $('body').append(this.$zoom_box);

      this.$zoom_in.click(function() {
        self.emit('zoom_in');
      });

      this.$zoom_out.click(function() {
        self.emit('zoom_out');
      });
    }
  });

  return ZoomModule;
});

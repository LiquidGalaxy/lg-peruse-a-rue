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
['config', 'bigl', 'stapes', 'jquery', 'leftui', 'doT'],
function(config, L, Stapes, $, leftUI, doT) {

  var ActivitiesModule = Stapes.subclass({
    constructor: function($template) {
      this.iface = config.lg_iface_base;
      this.template = doT.template($template.innerHTML);
    },

    init: function() {
      console.debug('Activities: init');

      var self = this;

      var activities = config.touchscreen.activities;

      if (activities == null) {
        console.debug('Activities: null or undefined');
        return;
      }

      if (!(activities instanceof Array)) {
        L.error('Activities: not an array');
        return;
      }

      if (activities.length == 0) {
        console.debug('Activities: empty array');
        return;
      }

      var activity_div = this.template(activities);

      leftUI.append(activity_div);

      $('.activities-item').on('click', function(e) {
        self._clicked(e.target);
      });
    },

    _clicked: function(activity) {
      var $activity = $(activity);
      var name   = $activity.html();
      var url    = $activity.attr('url');
      var method = $activity.attr('method').toUpperCase();

      if (method == 'LOCATION') {
        L.info('Activities: navigating to', name, 'at', url);
        window.location.href = url;
      } else if (method == 'GET' || method == 'POST' || method == 'PUT') {
        L.info('Activities: sending', method, 'to', name, 'at', url);
        var req = new XMLHttpRequest();
        req.open(method, url, true);
        req.send(null);
      } else {
        L.error('Activities: bad method for', name);
      }
    }
  });

  return ActivitiesModule;
});

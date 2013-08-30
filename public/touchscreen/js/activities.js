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
['config', 'bigl', 'stapes'],
function(config, L, Stapes) {

  var ActivitiesModule = Stapes.subclass({
    constructor: function($list) {
      this.$list = $list;
      this.iface = config.lg_iface_base;
    },

    init: function() {
      console.debug('Activities: init');

      var that = this;
      var activities = config.touchscreen.activities;
      var num_activities = activities.length;

      for(var i=0; i<num_activities; i++) {
        var activity = activities[i];

        var $li = document.createElement('li');
        $li.innerHTML = activity.title;
        $li.addEventListener("click", function(e) {
          that._clicked(this);
        }.bind(activity), true);

        this.$list.appendChild($li);
      }
    },

    _clicked: function(activity) {
      var name = activity.title;
      var app  = activity.app;
      L.info('switching to', name);
      var url = this.iface+'/change.php?query=relaunch-'+app+'&name='+name;
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.send(null);
    }
  });

  return ActivitiesModule;
});

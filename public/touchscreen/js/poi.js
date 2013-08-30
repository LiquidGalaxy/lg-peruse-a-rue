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
['config', 'bigl', 'stapes', 'zepto'],
function(config, L, Stapes, $) {

  var POIModule = Stapes.subclass({
    constructor: function($box, $categories) {
      this.$box = $box;
      this.$categories = $categories;
    },

    init: function() {
      this.categories = this._load_poi_from_url();

      for (var key in this.categories) {
        this._create_category( this.categories[key] );
      }

      // activate the first item
      this._activate( this.categories[Object.keys(this.categories)[0]] );
    },

    // return content from URL
    _load_poi_from_url: function() {
      var categories = null;

      $.ajax({
          url: this._get_content_url(),
          dataType: 'json',
          async: false,
          success: function(remote_data) { categories = remote_data },
          error: function(jqXHR, textStatus, errorThrown) {
            L.error('load_poi_from_url():', textStatus, ':', errorThrown);
            this.$box.style.display = 'none';
          }
      });

      return categories;
    },

    _get_content_url: function() {
      return config.touchscreen.poi_url || "/touchscreen/poi-defaults.json";
    },

    _activate: function(category) {
      this._deactivate_all();
      category.$tab.className="poi-tab-active";
      category.$list.className="poi-list-active";
    },

    _deactivate_all: function() {
      for (var key in this.categories) {
        var category = this.categories[key];
        category.$tab.className="poi-tab-inactive";
        category.$list.className="poi-list-inactive";
      }
    },

    _create_category: function(category) {
      var that = this;

      category.$tab = document.createElement('li');
      category.$tab.innerHTML = category.title;
      category.$tab.className="poi-tab-inactive";

      category.$tab.addEventListener("click", function(e) {
        that._activate(this);
      }.bind(category), true);

      this.$categories.appendChild( category.$tab );

      category.$div = document.createElement('div');
      this.$box.appendChild( category.$div );

      category.$list = document.createElement('ul');
      category.$list.className="poi-list-inactive";
      category.$div.appendChild( category.$list );

      for (var key in category.objects) {
        var loc = category.objects[key];
        var $li = document.createElement('li');
        $li.innerHTML = loc.title;
        category.$list.appendChild($li);

        // handle click events on the item
        $li.addEventListener("click", function(e) {
          that._clicked(this);
        }.bind(loc), true);

        this.emit('add_location', loc);
      }
    },

    _clicked: function(loc) {
      this.emit('select_location', loc);
    }
  });

  return POIModule;
});

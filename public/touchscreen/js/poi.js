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

  var POIModule = Stapes.subclass({
    constructor: function($template) {
      this.template = doT.template($template.innerHTML);
    },

    init: function() {
      console.debug('POI: init');

      var content_url = this._get_content_url();

      if (content_url == null) {
        console.debug('POI: content url is null or undefined');
        return;
      }

      this._load_poi_from_url(content_url);
    },

    // return content from URL
    _load_poi_from_url: function(content_url) {
      var self = this;
      var urls = content_url.split(",");
      var remote = [];
      var ajaxRequests = [];

      // loadData to create the Ajax requests for each POI files
      function loadData(url1) {
          var ajaxCall = $.ajax({
              url: url1,
              dataType: 'json',
              success: function(remote_data) {
                remote.push(remote_data[0]);
              },
              error: function(jqXHR, textStatus, errorThrown) {
                L.error('load_poi_from_url():', textStatus, ':', errorThrown);
              }
          });
          return ajaxCall;
      };

      // Framing an Array of Ajax Requests 
      $.each(urls, function( index, url ) {
        ajaxRequests.push(loadData(url));
      });


      // Calling jQuery.when with passing ajaxRequests we made 
      // This will wait for all the requests to complete and apply the categories and templates. 
      var allRequests = $.when.apply($, ajaxRequests);
      allRequests.done(function(){
        self._apply_categories(remote);
      });

    },

    _apply_categories: function(categories) {
      var self = this;

      if (categories == null) {
        console.debug('POI: null or undefined');
        return;
      }

      if (!(categories instanceof Array)) {
        L.error('POI: not an array');
        return;
      }

      if (categories.length == 0) {
        console.debug('POI: empty array');
        return;
      }

      var poi_div = this.template(categories);

      leftUI.prepend(poi_div);

      $('.poi-tab-inactive').on('click', function(e) {
        self._activate(e.target);
      });

      $('.poi-item').each(function(index, item) {
        self.emit('add_location', $(item).attr('panoid'));
      });

      this._activate($('.poi-tab-inactive').first());
    },

    _get_content_url: function() {
      return config.touchscreen.poi_url;
    },

    _activate: function(category) {
      var self = this;

      this._deactivate_all();

      var $category = $(category);
      $category.attr('class', 'poi-tab-active');

      var title = $category.html();
      var $list = $('.poi-list-inactive[category="'+title+'"]');
      $list.attr('class', 'poi-list-active');
      $list.children().on('click', function(e) {
        self._clicked(e.target);
      });
    },

    _deactivate_all: function() {
      $('.poi-tab-active').attr('class', 'poi-tab-inactive');
      $('.poi-list-active').attr('class', 'poi-list-inactive');
      $('.poi-item').off('click');
    },

    _clicked: function(loc) {
      var $loc = $(loc);
      var panoid = $loc.attr('panoid');
      this.emit('select_location', panoid);
      var hdg_attr = $loc.attr('heading');
      if (hdg_attr != null) {
        var hdg = Number(hdg_attr);
        this.emit('location_heading', hdg);
      }
    }
  });

  return POIModule;
});
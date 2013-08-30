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

requirejs.config({
  paths: {
    // *** RequireJS Plugins
    'async': '/js/lib/require/async',
    // *** Dynamic Global Configuration
    'config': '/js/config',
    // *** Common Deps
    'bigl': '/js/bigl',
    'fields': '/js/fields',
    'stapes': '/js/lib/stapes/stapes.min',
    'zepto': '/js/lib/zepto/zepto.min',
    'doT': '/js/lib/doT/doT.min',
    'socketio': '/socket.io/socket.io',
    'googlemaps': '/js/googlemaps'
  },
  shim: {
    'zepto': { exports: 'Zepto' },
    'config': { exports: 'config' },
    'googlemaps': {
      deps: [
        'async!http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false!callback'
      ]
    }
  }
});

require(
['map', 'poi', 'photospheres', 'viewsync', 'zoom', 'activities'],
function(
  MapModule,
  POIModule,
  PhotoSpheresModule,
  ViewSyncModule,
  ZoomModule,
  ActivitiesModule
) {

  var map = new MapModule(document.getElementById('map_canvas'));

  var poi = new POIModule(
    document.getElementById('poi-box'),
    document.getElementById('poi-categories')
  );

  var photospheres = new PhotoSpheresModule();

  var viewsync = new ViewSyncModule();

  var zoom_ctl = new ZoomModule(
    document.getElementById('zoom-in'),
    document.getElementById('zoom-out')
  );

  var activities = new ActivitiesModule(
    document.getElementById('activities-list')
  );

  zoom_ctl.on('zoom_in', function() {
    map.zoom_in();
  });

  zoom_ctl.on('zoom_out', function() {
    map.zoom_out();
  });

  viewsync.on('ready', function() {
    map.on('pano', function(panoid) {
      viewsync.sendPano(panoid);
    });
  });

  viewsync.on('pano', function(panoid) {
    map.update_pano_by_id(panoid);
  });

  poi.on('add_location', function(loc) {
    // TODO: support for latlng lookup
    map.add_location_by_id(loc.identifier);
  });

  poi.on('select_location', function(loc) {
    // TODO: support for latlng lookup
    map.select_pano_by_id(loc.identifier);
  });

  photospheres.on('add_location', function(panoid) {
    map.add_location_by_id(panoid);
  });

  map.on('ready', function() {
    viewsync.refresh();
  });

  map.init();

  viewsync.init();

  poi.init();

  photospheres.init();

  activities.init();

});

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
    'jquery': '/js/lib/jquery/jquery-2.0.3.min',
    'jquery-private': '/js/jquery-private',
    'jquery-collapse': '/js/lib/jquery/jquery.collapse',
    'doT': '/js/lib/doT/doT.min',
    'socketio': '/socket.io/socket.io',
    'googlemaps': '/js/googlemaps',
    'sv_svc': '/js/sv_svc'
  },
  shim: {
    'config': { exports: 'config' },
    'googlemaps': {
      deps: [
        'async!http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false!callback'
      ]
    }
  },
  map: {
    '*': { 'jquery': 'jquery-private' },
    'jquery-private': { 'jquery': 'jquery' }
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

  document.body.style['font-size'] = config.touchscreen.font_scale + 'em';

  var map = new MapModule(document.getElementById('map_canvas'));

  var poi = new POIModule(
    document.getElementById('poi-template')
  );

  var photospheres = new PhotoSpheresModule();

  var viewsync = new ViewSyncModule();

  var activities = new ActivitiesModule(
    document.getElementById('activities-template')
  );

  if (config.touchscreen.show_zoomctl) {
    var zoom_ctl = new ZoomModule();

    zoom_ctl.on('zoom_in', function() {
      map.zoom_in();
    });

    zoom_ctl.on('zoom_out', function() {
      map.zoom_out();
    });
  }

  viewsync.on('ready', function() {
    map.on('pano', function(panoid) {
      viewsync.sendPano(panoid);
    });
    map.on('meta', function(data) {
      viewsync.sendMeta(data);
    });
  });

  viewsync.on('pano', function(panoid) {
    map.update_pano_by_id(panoid);
  });

  poi.on('add_location', function(loc) {
    // TODO: support for latlng lookup
    map.add_location_by_id(loc);
  });

  poi.on('select_location', function(loc) {
    // TODO: support for latlng lookup
    map.select_pano_by_id(loc);
  });

  poi.on('location_heading', function(hdg) {
    viewsync.sendHdg(hdg);
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
  
  if(config.touchscreen.show_activities == true){
      activities.init();
  }
  

});

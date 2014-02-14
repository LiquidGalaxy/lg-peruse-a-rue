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
    'doT': '/js/lib/doT/doT.min',
    'socketio': '/socket.io/socket.io',
    'googlemaps': '/js/googlemaps',
    'sv_svc': '/js/sv_svc',
    'validate': '/js/validate'
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
['fields', 'streetview', 'viewsync', 'multiaxis'],
function(
  fields,
  StreetViewModule,
  ViewSyncModule,
  MultiAxisModule
) {

  var LOCAL_CONFIG = {
    master      : ('master' in fields)      ? fields.master      : false,
    yawoffset   : ('yawoffset' in fields)   ? fields.yawoffset   : 0,
    pitchoffset : ('pitchoffset' in fields) ? fields.pitchoffset : 0,
    rolloffset  : ('rolloffset' in fields)  ? fields.rolloffset  : 0,
    pano        : ('pano' in fields)        ? fields.pano        : null,
    heading     : ('heading' in fields)     ? Number(fields.heading)     : null
  };

  // *** initialize the StreetView module
  var sv = new StreetViewModule(
    document.getElementById('pano'),
    LOCAL_CONFIG.master
  );

  // *** initialize the ViewSync module
  var viewsync = new ViewSyncModule( LOCAL_CONFIG );

  // *** link StreetView canvas size changes to ViewSync
  sv.on('size_changed', function(fov) {
    viewsync.resize(fov);
  });

  // *** link ViewSync state events to StreetView
  sv.on('ready', function() {
    viewsync.on('pov_changed', function(pov) {
      sv.setPov(pov);
    });
    viewsync.on('pano_changed', function(panoid) {
      sv.setPano(panoid);
    });
  });

  sv.on('refresh', function() {
    viewsync.refresh();
  });

  // *** modules and linkages for master display only
  if (fields.master) {
    // *** link StretView state changes to ViewSync
    viewsync.on('ready', function() {
      if (LOCAL_CONFIG.pano != null) {
        viewsync.sendPano(LOCAL_CONFIG.pano);
      }
      sv.on('pov_changed', function(pov) {
        viewsync.sendPov(pov);
      });
      sv.on('pano_changed', function(pano) {
        viewsync.sendPano(pano);
      });
      sv.on('meta', function(data) {
        viewsync.sendMeta(data);
      });
    });

    // *** create and link the MultiAxis module
    var multiaxis = new MultiAxisModule();

    sv.on('ready', function() {
      if (LOCAL_CONFIG.heading != null) {
        sv.setHdg(LOCAL_CONFIG.heading);
      }
      multiaxis.on('abs', function(abs) {
        sv.translatePov(abs);
      });
      multiaxis.on('move_forward', function() {
        sv.moveForward();
      });
    });

    multiaxis.init();
  }

  // *** create the Maps API objects
  sv.init();

  // *** connect the ViewSync socket
  viewsync.init();
});

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
['config', 'bigl', 'stapes', 'socketio'],
function(config, L, Stapes, io) {

  var ViewSyncModule = Stapes.subclass({
    constructor: function() {
      this.socket = null;
      this.pov = null;
    },

    init: function() {
      console.debug('ViewSync: init');

      var self = this;

      this.socket = io.connect('/viewsync');

      this.socket.once('connect', function() {
        console.debug('ViewSync: ready');
        self.emit('ready');
      });

      this.socket.on('sync pano', function(panoid) {
        self.emit('pano', panoid);
      });

      this.socket.on('sync pov', function(pov) {
        self.pov = pov;
      });

      this.socket.on('connect_failed', function() {
        L.error('ViewSync: connection failed!');
      });
      this.socket.on('disconnect', function() {
        L.error('ViewSync: disconnected');
      });
      this.socket.on('reconnect', function() {
        console.debug('ViewSync: reconnected');
      });
    },

    sendPano: function(panoid) {
      this.socket.emit('pano', panoid);
      L.info('ViewSync: sendPano', panoid);
    },

    sendMeta: function(data) {
      this.socket.emit('meta', data);
    },

    sendHdg: function(hdg) {
      this.socket.emit('pov', {
        heading: hdg,
        pitch: this.pov.pitch,
      });
    },

    refresh: function() {
      console.debug('ViewSync: sending refresh');
      this.socket.emit('refresh');
    }
  });

  return ViewSyncModule;
});

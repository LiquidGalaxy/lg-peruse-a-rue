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
['socketio'],
function(io) {

  var Lsocket = io.connect('/L');

  console.log('logger connecting');

  Lsocket.on('connect', function() {
    console.log('logger connected');
  });

  Lsocket.on('connect_failed', function() {
    console.log('logger connection failed!');
  });
  Lsocket.on('disconnect', function() {
    console.log('logger handler disconnected');
  });

  var L = {};
  var L_KEYS = ['log', 'warn', 'error', 'debug', 'info'];
  var L_KEYS_LENGTH = L_KEYS.length;
  var L_FUNC = function(facility) {
    return function() {
      var msg = Array.prototype.join.call(arguments, ' ');
      console[facility](msg);
      Lsocket.emit(facility, msg);
    }
  }

  for(var i=0; i<L_KEYS_LENGTH; i++) {
    var facility = L_KEYS[i];

    L[facility] = L_FUNC(facility);
  }

  return L;
});

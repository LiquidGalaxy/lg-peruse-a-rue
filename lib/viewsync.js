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

var relay = function( io ) {
  var state = {};
  var relayKeys = [
    'pov',
    'pano'
  ];
  
  function refresh( socket ) {
    for( var sig in state )
      syncSingle( socket, sig, state[sig] );
  }

  function syncBroad( socket, sig, data ) {
    socket.broadcast.emit( 'sync ' + sig, data );
  }
  
  function syncSingle( socket, sig, data ) {
    socket.emit( 'sync ' + sig, data );
  }
  
  function bounce( socket, sig ) {
    socket.on( sig, function (data) {
      state[this] = data;
      syncBroad( socket, this, data );
    }.bind(sig));
  }
  
  var viewsync = io
    .of('/viewsync')
    .on('connection', function (socket) {
      // send the last known state to the client on connection
      socket.on('refresh', function () {
        refresh( socket );
      });
      for( var key in relayKeys )
        bounce( socket, relayKeys[key] );
    });

  return viewsync;
};

module.exports.relay = relay;

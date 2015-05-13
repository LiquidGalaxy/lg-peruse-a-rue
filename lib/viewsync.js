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

var panoToEarthQuery = require('./pano-to-earth-query');

function getInitPov() {
  return { heading: 0, pitch: 0 };
}

function ViewSyncRelay( io, config ) {
  var viewState = {
    // initialize a google.maps.StreetViewPov
    pov: getInitPov(),
    // start at the default pano
    pano: config.display.default_pano
  };

  function refresh( socket ) {
    for( var sig in viewState )
      syncSingle( socket, sig, viewState[sig] );
  }

  function syncBroad( socket, sig, data ) {
    socket.broadcast.emit( 'sync ' + sig, data );
  }
  
  function syncSingle( socket, sig, data ) {
    socket.emit( 'sync ' + sig, data );
  }
  
  function bounce( socket, sig ) {
    socket.on( sig, function (data) {
      viewState[this] = data;
      syncBroad( socket, this, data );
    }.bind(sig));
  }

  function bounceAll( socket ) {
    for( var key in viewState )
      bounce( socket, key );
  }
  
  var viewsync = io
    // only listen on the viewsync namespace
    .of('/viewsync')

    .on('connection', function (socket) {
      // send the last known state to the client on request
      socket.on('refresh', function () {
        refresh( socket );
      });

      socket.on('meta', function(data) {
        panoToEarthQuery(data);
      });

      if (config['always_revert_to_default_pano']) {
        socket.on('disconnect', function() {
          /* there's always 1... */
          if (io.sockets.clients().length <= 1) {
            viewState = {
              // initialize a google.maps.StreetViewPov
              pov: getInitPov(),
              // start at the default pano
              pano: config.display.default_pano
            }
          }
        });
      }

      // set up relay handlers
      bounceAll( socket );
    });

  return {
    setPano: function( panoid ) {
      viewState.pano = panoid;
      refresh( viewsync );
    },

    resetPov: function() {
      viewState.pov = getInitPov();
      refresh( viewsync );
    },

    io: viewsync
  }
};


module.exports.relay = ViewSyncRelay;

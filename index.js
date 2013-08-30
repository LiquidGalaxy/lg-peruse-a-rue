#!/usr/bin/env node
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

var config = require('./lib/config');
var program = require('commander');
var path = require('path');
var stylus = require('stylus');

module.exports.main = function() {

  program
    .option( '-p, --port [port]', 'Listen port ['+config.port+']', config.port )
    .option( '-u, --udp [port]', 'UDP port ['+config.udp_port+']', config.udp_port )
    .parse( process.argv );

  var listenPort = Number(program.port);
  var udpPort = listenPort;
  if( program.udp ) udpPort = Number(program.udp);

  // serve http from this path
  var docRoot = path.join(__dirname, 'public');

  //
  // start up the HTTP server
  //

  var connect = require('connect');

  var app = connect()
      //.use( connect.logger( 'dev' ) )
      .use( stylus.middleware({
        src: docRoot,
        dest: docRoot,
        compile: function(str, path) {
          console.log('stylus: compiling new styles');
          return stylus(str)
          .set('filename', path)
          .set('compress', true)
        }
      }))
      .use( connect.static( docRoot ) )
      .use( config.middleware )
      .use( function( req, res ) {
        res.statusCode = 404;
        res.end('<h1>404</h1>');
      })
      .listen( listenPort );

  //
  // begin socket.io
  //

  var io = require('socket.io').listen(app);
  io.set( 'log level', 1 );

  //
  // start up the client exception logger
  //

  var logger = require('./lib/bigl').handler(io);

  //
  // start up the viewsync app
  //

  var viewsyncKeys = [
    'pov',
    'pano'
  ];

  var viewsync = require('./lib/viewsync').relay( io, viewsyncKeys );

  //
  // spacenav/multiaxis device interface
  //

  var multiaxis = require('./lib/multiaxis').relay( io, udpPort );

} // exports.main

if (!module.parent) {
  module.exports.main();
}

//vim:set noai

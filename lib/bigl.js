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

var T_DIGITS = 10;

var STDOUT = console.log;
var STDERR = console.error;

var FACILITIES = {
  "log"   : STDOUT,
  "debug" : STDOUT,
  "info"  : STDOUT,
  "warn"  : STDERR,
  "error" : STDERR
};

var LOG_FORMAT = "[{time}] L.{facility}: {msg}";

function getTime() {
  // XXX: process.uptime() returns different precision depending on OS!
  return process.uptime().toString().slice(0,T_DIGITS);
}

module.exports.handler = function(io) {

  return io.of('/L')
    .on('connection', function(socket) {
      for (var facility in FACILITIES) {
        var out = FACILITIES[facility];
        var name = facility.toUpperCase();

        socket.on(facility, function(msg) {
          var time = getTime();

          var log_line = LOG_FORMAT
            .replace('{time}', time)
            .replace('{facility}', this.name)
            .replace('{msg}', msg);

          this.out(log_line);

        }.bind({out:out, name:name}));
      }
    });
}

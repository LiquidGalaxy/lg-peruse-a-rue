/*
** Copyright 2014 Google Inc.
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

var http = require('http');
var config = require('./config');

var camTemplate = "<Camera><longitude>{{longitude}}</longitude><latitude>{{latitude}}</latitude><altitude>500</altitude><heading>0</heading><tilt>0</tilt><roll>0</roll><gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode></Camera>"

function panoToEarthQuery(panoData) {
  if (!config['lg_iface_base']) return;

  var latLng = panoData.location.latLng;

  var camera = camTemplate
    .replace('{{longitude}}', latLng.lng)
    .replace('{{latitude}}',  latLng.lat);

  var query = config['lg_iface_base'] + '/change.php?name=Peruse&query=flytoview=' + camera;

  http.get(query, function(res) {
    if (res.statusCode != 200) {
      console.error('HTTP error while sending pano query to change.php:', res.statusCode);
      console.error(JSON.stringify(res.headers));
    }
  }).on('error', function(e) {
    console.error('request error while sending pano query to change.php:', e.message);
  });
}

module.exports = panoToEarthQuery;

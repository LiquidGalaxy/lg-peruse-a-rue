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

/*
 *
 *<NetworkLink>
 *  <name>Peruse Submit</name>
 *  <description>Submit current view parameters to Peruse-a-Rue Server</description>
 *  <Link>
 *    <href>http://<peruse-server>:<peruse-port>/ge</href>
 *    <refreshMode>onInterval</refreshMode>
 *    <refreshInterval>1</refreshInterval>
 *    <viewRefreshMode>onStop</viewRefreshMode>
 *    <viewRefreshTime>1</viewRefreshTime>
 *    <viewFormat>BBOX=[bboxWest];BBOX=[bboxSouth];BBOX=[bboxEast];BBOX=[bboxNorth];LOOKAT=[lookatLon];LOOKAT=[lookatLat];LOOKAT=0;LOOKAT=[lookatRange];LOOKAT=[lookatTilt];LOOKAT=[lookatHeading];CAMERA=[cameraLon];CAMERA=[cameraLat];CAMERA=[cameraAlt];CAMERA=[lookatRange];CAMERA=[lookatTilt];CAMERA=[lookatHeading]</viewFormat>
 *  </Link>
 *</NetworkLink>
 *
 */

var qs  = require('querystring'),
    url = require('url'),
    ge  = { 
            BBOX:   [0,0,0,0],
            LOOKAT: [0,0,0,0,0,0],
            CAMERA: [0,0,0,0,0,0],
          };

function urlHandler(req, res, next) {
  if( req.url.indexOf("/ge") == 0 && req.method == 'POST' ) {
    var body='';
    req.on('data', function(data) {
      body += data;
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~1MB
      if (body.length > 1e6) { 
        // nuke bad request
        req.connection.destroy();
      }
      req.on('end', function() {
        var POST = qs.parse(body);
        console.log(POST);
      });
    });
    // return valid KML to Earth
    res.writeHead(200, {'Content-Type': 'application/vnd.google-earth.kml+xml'});
    res.end('\n');
  } else if( req.url.indexOf("/ge") == 0 && req.method == 'GET' ) {
    var full_query = url.parse( req.url ).query;
    if (full_query.length <= 200 ) {
      console.log('received a short query: '+full_query.length);
    }
    //console.log(full_query);
    /*
     * Using a NetworkLink like the one in the header, Earth master should be GETing: 
     *
     *  /ge?<viewFormat>
     *
     * we want an object from that to represent the Bounding Box(BBOX),
     * the LookAt(LOOKAT) and the Camera(CAMERA)
     */
    var ge = qs.parse(full_query,';');

    var center_lat = ( (parseFloat(ge.BBOX[3]) - parseFloat(ge.BBOX[1])) /2 ) + parseFloat(ge.BBOX[1]);
    var center_lng = ( (parseFloat(ge.BBOX[2]) - parseFloat(ge.BBOX[0])) /2 ) + parseFloat(ge.BBOX[0]);
    //console.log('center: ' + center_lng +','+ center_lat );

    // return valid KML to Earth
    res.writeHead(200, {'Content-Type': 'application/vnd.google-earth.kml+xml'});
    res.end('<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
      + '<Placemark>\n'
      + '<Style id="no-pushpin"><IconStyle><color>00000000</color></IconStyle><LabelStyle><color>00ffffff</color></LabelStyle></Style>\n'
      + '<name>viewFormat Placemark</name>\n'
      + '<styleUrl>#no-pushpin</styleUrl>\n'
      + '<Point>\n<coordinates>'+ center_lng +','+ center_lat +'</coordinates>\n</Point>\n'
      //+ '<Point>\n<coordinates>0,0</coordinates>\n</Point>\n'
      + '</Placemark>\n'
      + '</kml>');
  } else {
    //console.log( req.url );
    next();
  }
};

exports.handler = urlHandler;
//exports.ge      =
// We need to export the object we created from parsing the URL
// So that other modules can access it at will

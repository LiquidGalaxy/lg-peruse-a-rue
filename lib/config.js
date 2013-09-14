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

var extend = require('extend');

try {
  var config = require('../config_defaults.json');
} catch (err) {
  console.error('config ERROR: could not load defaults');
  throw err;
}

// *** Import config file if present
var configFile = {};

try {
  var configFile = require('../config.json');
} catch (err) {
  console.log('config INFO: file could not be imported, using defaults');
}

// *** Deep copy the config file's keys over the defaults
extend(true, config, configFile);

module.exports = config;

// *** Generate and serve browser-side javascript
var clientConfig = 'var config = {}'.replace('{}', JSON.stringify(config));

module.exports.middleware = function(req, res, next) {
  if (req.url == '/js/config.js') {

    res.setHeader('Content-Type', 'text/javascript');

    res.end(clientConfig);
  } else {
    next();
  }
}

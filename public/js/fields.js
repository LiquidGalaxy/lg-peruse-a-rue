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

define([], function() {

  var fields = function () {
    var out_fields = {};
    var query_fields = window.location.search.split('?')[1];
    if( query_fields ) {
      query_fields = query_fields.split('&');
      for( var i in query_fields ) {
        var raw = query_fields[i].split('=');
        if( raw.length > 1 )
          out_fields[raw[0]] = raw[1];
      }
    }
    return out_fields;
  }();

  return fields;
});

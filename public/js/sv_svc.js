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

define(['googlemaps'], function(GMaps) {
  // provide StreetViewService as a singleton in this module
  var sv_svc = new GMaps.StreetViewService();

  function getPanoramaByLocation(latlng, radius, cb, max_radius) {
    var locationRequest = {
      location: latlng,
      preference: GMaps.StreetViewPreference.NEAREST,
      radius: max_radius || radius
    };

    sv_svc.getPanorama(
      locationRequest,
      cb
    );
  }

  function getPanoramaById(pano, cb) {
    var panoRequest = {
      pano: pano
    };

    sv_svc.getPanorama(
      panoRequest,
      cb
    );
  }

  // make StreetViewPanoramaData friendlier
  function serializePanoData(panoData) {
    panoData.location.latLng = {
      lat: panoData.location.latLng.lat(),
      lng: panoData.location.latLng.lng()
    };
  }

  return {
    // use our wrapped ID search
    getPanoramaById: getPanoramaById,

    // use our wrapped location search
    getPanoramaByLocation: getPanoramaByLocation,

    serializePanoData: serializePanoData
  }
});

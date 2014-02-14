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

  // extensions to getPanoramaByLocation:
  // optional expansion to max_radius
  // pass original search latlng to the callback
  function getPanoramaByLocation(latlng, radius, cb, max_radius) {
    var search_opts = {
      latlng: latlng,
      radius: radius,
      max_radius: max_radius || radius,
      cb: cb
    };

    sv_svc.getPanoramaByLocation(
      latlng,
      radius,
      expandingCB.bind(search_opts)
    );
  }

  // recursive callback for expanding search
  function expandingCB(data, stat) {
    if (stat == GMaps.StreetViewStatus.OK) {
      // success
      this.cb(data, stat, this.latlng);

    } else if (this.radius < this.max_radius) {
      // expand the search
      this.radius *= 2;
      if (this.radius > this.max_radius)
        this.radius = this.max_radius;

      getPanoramaByLocation(
        this.latlng,
        this.radius,
        this.cb,
        this.max_radius
      );

    } else {
      // failure
      this.cb(data, stat, this.latlng);
    }

    // explicit cleanup
    delete this;
  }

  // make StreetViewPanoramaData friendlier
  function serializePanoData(panoData) {
    panoData.location.latLng = {
      lat: panoData.location.latLng.lat(),
      lng: panoData.location.latLng.lng()
    };
  }

  return {
    // passthrough ID search
    getPanoramaById: sv_svc.getPanoramaById,

    // use our wrapped location search
    getPanoramaByLocation: getPanoramaByLocation,

    serializePanoData: serializePanoData
  }
});

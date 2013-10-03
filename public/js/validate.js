define([], function() {
  var validate = {
    number: function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },

    // validate a Google panoid
    panoid: function(panoid) {
      if (panoid.match(/^[\w-]{22}$/) != null)
        return true;
      else
        return false;
    },

    // validate google.maps.StreetViewPov
    pov: function(pov) {
      if (this.number(pov.heading) && this.number(pov.pitch))
        return true;
      else
        return false;
    },

    // validate an angular field of view object
    fov: function(fov) {
      if (this.number(fov.hfov) && this.number(fov.vfov))
        return true;
      else
        return false;
    }
  };

  return validate;
});

define(['jquery', 'jquery-collapse'], function($, jQueryCollapse) {
  var $leftUI = $('#left-ui');
  var open_listeners = [];

  function refresh() {
    new jQueryCollapse($leftUI, {
      accordion: true,
      query: 'div h2',
      open: function() {
        var num_listeners = open_listeners.length;
        for(var i=0; i<num_listeners; i++) {
          open_listeners[i](this);
        }

        this.show();
      }
    });
  }

  return {
    append: function($el) {
      $leftUI.append($el);
      refresh();
    },

    prepend: function($el) {
      $leftUI.prepend($el);
      refresh();
    },

    addOpenListener: function(cb) {
      open_listeners.push(cb);
    }
  }
});

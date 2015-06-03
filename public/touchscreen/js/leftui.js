define(['config', 'jquery', 'jquery-collapse'], function(config,$, jQueryCollapse) {
  var $leftUI = $('#left-ui');

  function refresh() {
    var fun = new jQueryCollapse($leftUI, {
      accordion: false,
      query: 'div h2'
    });
    if(config.touchscreen.expand_poi == true){
      fun.open(0);
    }
  }

  return {
    append: function($el) {
      $leftUI.append($el);
      refresh();
    },

    prepend: function($el) {
      $leftUI.prepend($el);
      refresh();
    }
  }
});

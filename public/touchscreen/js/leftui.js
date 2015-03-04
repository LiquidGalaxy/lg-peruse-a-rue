define(['config', 'jquery', 'jquery-collapse'], function(config,$, jQueryCollapse) {
  var $leftUI = $('#left-ui');

  function refresh() {
    var fun = new jQueryCollapse($leftUI, {
      accordion: false,
      query: 'div h2'
    });

    if(config.touchscreen.show_activities == true){
      fun.open(1);
    }
    if(config.touchscreen.show_poi == true){
      fun.open(0);
      if(config.touchscreen.show_activities == false){
        fun.close(1);
      }
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

define(['jquery', 'jquery-collapse'], function($, jQueryCollapse) {
  var $leftUI = $('#left-ui');

  function refresh() {
    new jQueryCollapse($leftUI, {
      accordion: true,
      query: 'div h2'
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
    }
  }
});

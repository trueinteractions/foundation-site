hljs.initHighlightingOnLoad();

function moveToHash(e) {
  var target = $(e);
  if(target.length) {
    var offset = {scrollTop:(target.offset().top - 50)};
    var setHash = (e != location.hash) ? function() { location.hash = e; } : function(){};
    $('html,body').animate(offset, 300, 'swing', setHash);
  }
}

function hashChange() {
  var target = $(location.hash);
  if(target.length > 0) {
    moveToHash(location.hash);
    if(!target.hasClass('active'))
      target.accordion('open');
  }
}

window.addEventListener('load', function() {
  $('.ui.accordion').accordion({'exclusive':false, 'duration':300});

  hashChange();

  $(window).on('hashchange', function() {
    hashChange();
  });

  $('.ui.accordion .title').click(function(e) {
      e.preventDefault();
      if(!$(e.target).hasClass('active'))
        moveToHash('#'+e.target.id);
  });
  $.getJSON("data.json", function( data ) {
    $('.ui.search').search({ source:data });
  });

  // This fixes an issue where scrolling via "swipe" on
  // OSX won't work unless focus is gained. So if we are
  // "over" the menu elements, focus them.
  $('.ui.vertical.fluid.menu').mouseover(function(e) {
    $(e).focus();
  });

  $('.ui.dropdown').dropdown();
});
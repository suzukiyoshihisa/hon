/*!
 * ScriptName: shared.js
 *
 * FoodConnection
 * http://foodconnection.jp/
 * http://foodconnection.vn/
 *
 */

$(document).ready(function () {
  $(".sub").hide();
	$(".nav-menu span").click(function () {
    if ($(this).parent().hasClass("active")) {
			$(this).parent().removeClass("active");
      $(".sub").slideUp(500);
		} else {
			$(this).parent().addClass("active");
      $(".sub").slideDown(500);
		}    				
	});

$(".hamburger-wrap").click(function () {
      if ($("body").hasClass("nav-open")) {
        $("body").removeClass("nav-open");
      } else {
        $("body").addClass("nav-open");
      }
	});
  
  if($(window).width() > 768) {
		$(".nav-menu .close").click(function () {
        $('body').removeClass("nav-open");
    });
    $(".nav-mask").click(function () {
        $('body').removeClass("nav-open");
    });
	}
  
});



$(document).ready(function () {
  $(window).scroll(function () {
    var TargetPos = $('section.block').offset().top;
    var ScrollPos = $(window).scrollTop();
    if (ScrollPos > TargetPos) {
      $("body").addClass('has-nav');
    } else {
      $("body").removeClass('has-nav');
    }
  });
});

//fix scroll ios
var overflowIsHidden = function(node) {
    var style = getComputedStyle(node);
    return style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden";
}
var isItScrollableWithoutVisibleScrollbars = function(el) {
    if (el === null) return false;
    var isScrollable = false,
        hasScrollbars = false;
    isScrollable = el.scrollHeight > el.offsetHeight ? true : false; // first, lets find out if it has scrollable content
    // isScrollable = el.scrollHeight + 1 > el.clientHeight ? true : false; // first, lets find out if it has scrollable content
    if (isScrollable) hasScrollbars = (el.offsetWidth > el.scrollWidth) ? true : false; // if it's scrollable, let's see if it likely has scrollbars
    // if (isScrollable) hasScrollbars = (el.offsetWidth > el.scrollWidth - 1) ? true : false; // if it's scrollable, let's see if it likely has scrollbars
    if (isScrollable && !hasScrollbars && !overflowIsHidden(el)) return true;
    else return false;
};
document.addEventListener("touchmove", function(e) {
    if (document.body.classList.contains("nav-open") && !isItScrollableWithoutVisibleScrollbars(document.getElementById("nav-menu"))) e.preventDefault();
}, {
    passive: false
});
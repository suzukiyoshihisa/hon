/*--------------------------------------------------*/
/*         リンクのURLにパラメーターを引継ぎ
/*--------------------------------------------------*/
document.addEventListener("DOMContentLoaded", function() {
  var param = window.location.search;
  var paramLinkElements = document.querySelectorAll(".p-parameter-link");

  if (param) {
    paramLinkElements.forEach(function(obj) {
      var link = obj.getAttribute("href");
      obj.setAttribute("href", link + param);
    });
  }
});


/*--------------------------------------------------*/
/*          changing image
/*--------------------------------------------------*/
$(function() {
  // 置換の対象とするclass属性。
  var $elem = $('.chimg');
  // 置換の対象とするsrc属性の末尾の文字列。
  var sp = '_sp.';
  var pc = '_pc.';
  // 画像を切り替えるウィンドウサイズ。
  var replaceWidth = 768;

  function imageSwitch() {
    // ウィンドウサイズを取得する。
    var windowWidth = parseInt($(window).width());

    // ページ内にあるすべての`.js-image-switch`に適応される。
    $elem.each(function() {
      var $this = $(this);
      // ウィンドウサイズが768px以上であれば_spを_pcに置換する。
      if(windowWidth >= replaceWidth) {
        $this.attr('src', $this.attr('src').replace(sp, pc));

      // ウィンドウサイズが768px未満であれば_pcを_spに置換する。
      } else {
        $this.attr('src', $this.attr('src').replace(pc, sp));
      }
    });
  }
  imageSwitch();

  // 動的なリサイズは操作後0.2秒経ってから処理を実行する。
  var resizeTimer;
  $(window).on('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      imageSwitch();
    }, 200);
  });
});


/*--------------------------------------------------*/
/*          scroll
/*--------------------------------------------------*/

$(function(){
  $('a[href^="#"]').click(function(){
    let speed = 800;
    let href= $(this).attr("href");
    let target = $(href == "#" || href == "" ? 'html' : href);
    let position = target.offset().top;
    $("html, body").animate({scrollTop:position}, speed, "swing");
    return false;
  });
});


/*--------------------------------------------------*/
/*          page top
/*--------------------------------------------------*/

$(function() {
	var topBtn = $('#page-top');
	topBtn.hide();
	//スクロールが100に達したらボタン表示
	$(window).scroll(function () {
		if ($(this).scrollTop() > 1) {
			topBtn.fadeIn();
		} else {
			topBtn.fadeOut();
		}
	});
	//スクロールしてトップ
    topBtn.click(function () {
		$('body,html').stop().animate({
			scrollTop: 0
		}, 500);
		return false;
    });
});



if(!navigator.userAgent.match(/(iPhone|iPad|Android)/)){

$(function(){
  $(window).scroll(function(e){
    var bottomY = 30, //スクロール時の下からの位置
      $window = $(e.currentTarget),
      height = $window.height(), //ウィンドウ(ブラウザ)の高さ
      scrollTop = $window.scrollTop(), //スクロール量
      documentHeight = $(document).height(), //ページ全体の高さ
      footerHeight = $("footer").height()+130; //フッタの高さ
      bottomHeight = footerHeight + height + scrollTop + bottomY - documentHeight;
    if(scrollTop >= documentHeight - height - footerHeight + bottomY){
      $('#page-top').css({ bottom: bottomHeight - bottomY }); //スクロール時にbottomの値が変動
    }else{
      $('#page-top').css({ bottom: bottomY });
    }
  });
});

}
else{

$(function(){
  $(window).scroll(function(e){
    var bottomY = 30, //スクロール時の下からの位置
      $window = $(e.currentTarget),
      height = $window.height(), //ウィンドウ(ブラウザ)の高さ
      scrollTop = $window.scrollTop(), //スクロール量
      documentHeight = $(document).height(), //ページ全体の高さ
      footerHeight = $("footer").height()+10; //フッタの高さ
      bottomHeight = footerHeight + height + scrollTop + bottomY - documentHeight;
    if(scrollTop >= documentHeight - height - footerHeight + bottomY){
      $('#page-top').css({ bottom: bottomHeight - bottomY }); //スクロール時にbottomの値が変動
    }else{
      $('#page-top').css({ bottom: bottomY });
    }
  });
});

}

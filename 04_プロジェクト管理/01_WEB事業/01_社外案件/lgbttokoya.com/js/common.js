//ページスクロール

$(function() {
	$('a[href*=#]').click(function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length && target;
			if (target.length) {
				var sclpos = 0;
				var scldurat = 1200;
				var targetOffset = target.offset().top - sclpos;
				$('html,body')
					.animate({scrollTop: targetOffset}, {duration: scldurat, easing: "easeOutExpo"});
				return false;
			}
		}
	});

	$('area[href*=#]').click(function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length && target;
			if (target.length) {
				var sclpos = 0;
				var scldurat = 1200;
				var targetOffset = target.offset().top - sclpos;
				$('html,body')
					.animate({scrollTop: targetOffset}, {duration: scldurat, easing: "easeOutExpo"});
				return false;
			}
		}
	});

});

//タブ
var tab = {
	init: function(){
		var tabs = this.setup.tabs;
		var pages = this.setup.pages;
		
		for(i=0; i<pages.length; i++) {
			if(i !== 0) pages[i].style.display = 'none';
			tabs[i].onclick = function(){ tab.showpage(this); return false; };
		}
	},
	
	showpage: function(obj){
		var tabs = this.setup.tabs;
		var pages = this.setup.pages;
		var num;
		
		for(num=0; num<tabs.length; num++) {
			if(tabs[num] === obj) break;
		}
		
		for(var i=0; i<pages.length; i++) {
			if(i == num) {
				pages[num].style.display = 'block';
				tabs[num].className = 'present';
			}
			else{
				pages[i].style.display = 'none';
				tabs[i].className = null;
			}
		}
	}
}


//ストライプテーブル
$(function() {
    $(".stripe tr:even").addClass("even");
});


//プルダウン
$(function(){
    $("ul#globalNavigation ul").hide();
    $("ul#globalNavigation li").hover(function(){
            $("ul:not(:animated)",this).slideDown("fast")
        },
        function(){
            $("ul",this).slideUp("fast");
    })
})

//png画像×opacityのジャギ発生回避
$(function() {
    if(navigator.userAgent.indexOf("MSIE") != -1) {
        $('img').each(function() {
            if($(this).attr('src').indexOf('.png') != -1) {
                $(this).css({
                    'filter': 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' +
                    $(this).attr('src') +
                    '", sizingMethod="scale");'
                });
            }
        });
    }
});


//
// --------------------------------------------------------------------
// Author  : mashimonator
// Create  : 2009/11/17
// Update  : 2009/11/17
//         : 2009/12/28 IE6で発生していたエラーを修正

// Description : リンクに指定されたファイルのサイズを自動で取得して表示する
// --------------------------------------------------------------------

/*@cc_on 
var doc = document;
eval('var document = doc');
@*/
var fileSizeGetter = {
	//-----------------------------------------
	// 設定値
	//-----------------------------------------
	conf : {
		// サイズを取得する対象の拡張子
		extension : [ '.pdf', '.xlsx', '.xls', '.docx', '.doc', '.zip', '.lzh', '.cab', '.txt', '.exe' ]
	},
	//-----------------------------------------
	// 初期処理
	//-----------------------------------------
	init : function() {
		var elements = document.getElementsByTagName('A');
		for (var i = 0, len = elements.length; i < len; i++) {
			for (var x = 0, len2 = fileSizeGetter.conf.extension.length; x < len2; x++) {
				var href = elements[i].getAttribute('href');
				var reg = new RegExp( fileSizeGetter.conf.extension[x] + '$', 'i' );
				if ( href && href.match(reg) ) {
					// サイズ取得
					var size = fileSizeGetter.getFileSize(href);
					// サイズを挿入
					if ( size ) {
						elements[i].innerHTML += ' (' + fileSizeGetter.convUnit(size) + ')';
					}
					break;
				}
			}
		}
	},
	// -----------------------------------
	// ファイルサイズを取得する
	// -----------------------------------
	getFileSize : function( href ) {
		// HTTP通信用オブジェクト生成
		var httpObj = fileSizeGetter.createXMLHttpRequest();
		if ( !httpObj ) {
			return false;
		}
		// 同期通信
		httpObj.open('HEAD', href, false);
		try {
			httpObj.send(null);
		} catch(e) {
			// 404 Not Found
			return false;
		}
		// 結果を取得
		if ( !httpObj.getResponseHeader('Content-Length') ) {
			// No Content-Length
			return false;
		} else {
			// Return Content-Length
			if ( httpObj.readyState == 4 && httpObj.status == 200 ) {
				return httpObj.getResponseHeader('Content-Length');
			} else {
				return false;
			}
		}
	},
	// -----------------------------------
	// 単位を変換する
	// -----------------------------------
	convUnit : function( num ) {
		if ( num > 1048576 ) {
			// MByte
			num = num / (1024*1024);
			return Math.round(num * 100) / 100 + 'MB';
		} else if ( num > 1024 ) {
			// KByte
			num = num / 1024;
			return Math.ceil(num) + 'KB';
		} else {
			// byte
			return Math.ceil(num) + 'B';
		}
	},
	// -----------------------------------
	// HTTP通信用オブジェクト生成
	// -----------------------------------
	createXMLHttpRequest : function() {
		var XMLhttpObject = null;
		try {
			XMLhttpObject = new XMLHttpRequest();
		} catch(e) {
			var progids = new Array('MSXML2.XMLHTTP.5.0', 'MSXML2.XMLHTTP.4.0', 'MSXML2.XMLHTTP.3.0', 'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP');
			for (var i = 0, len = progids.length; i < len; i++) {
				try {
					XMLhttpObject = new ActiveXObject(progids[i]);
				} catch (e) {
					XMLhttpObject = null;
				}
			}
		}
		return XMLhttpObject;
	},
	//-----------------------------------------
	// イベントに関数を付加する
	//-----------------------------------------
	addEvent : function( target, event, func ) {
		try {
			target.addEventListener(event, func, false);
		} catch (e) {
			target.attachEvent('on' + event, (function(el){return function(){func.call(el);};})(target));
		}
	}
}
// 実行
fileSizeGetter.addEvent( window, 'load', fileSizeGetter.init );


$(function(){
     $("#contentsIndex li,.subjectIndex li,#researcherIndex li").click(function(){
         window.location=$(this).find("a").attr("href");
         return false;
    });
});


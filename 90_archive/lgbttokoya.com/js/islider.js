//by Michalis Tzikas
//thanks to www.webhoster.gr & www.michalistzikas.com
//27-04-2011
//v1.0
//web site: http://www.jquery.gr/iSlider
/*
Copyright (C) 2011 by Michalis Tzikas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
	(function( $ ){
	  $.fn.islider = function(options) {
		  
			var defaults = {
				speed   : 10000,
				change	: 800,
				frame	: 253
			};
			var options = $.extend(defaults, options);
	  
		page = 1;
		page_ = 2;

		size = $("#slideImage .islider").size();
		$('#slideImage .islider').addClass('next_center_frame');
		$('#slideImage .islider').first().removeClass('next_center_frame');
		$('#slideImage .islider').first().addClass('center_frame');
		
		i = 1;
		$('#slideImage .islider').each(function(){
			$(this).addClass('page'+i++);
		});
		
		setInterval(function() { 
			$(".page"+page).animate({
				left: '-=4000'
			}, options.change, function() {
				$(this).css('left','4000px');
				page++;
			});
			if(page_ == size+1){
				page = 0;
				page_ = 1;	
			}
			$(".page"+page_).animate({
				left: '0'
			}, options.change, function() {
				page_++;
				t = (page*options.frame)*(-1);
				$(".page"+page_).css('top',t);
			});		
		}, options.speed);	
	  };
})( jQuery );
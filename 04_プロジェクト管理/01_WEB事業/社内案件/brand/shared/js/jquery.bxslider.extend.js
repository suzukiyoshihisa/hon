"use strict";

if (!defined("FCBase")) define("FCBase");

FCBase.bxSlider = {
	version: {
		current: null,
		release: "unknown"
	},
	setOption: function(key, value) {
		var self = this;

		if (key && key.constructor === Object) {
			Object.keys(key).forEach(function(k) {
				self.setOption(k, key[k]);
			});
		}
		else {
			if (key in self.options) self.settings[key] = value;
			else console.info("`" + key + "` is invalid");
		}
	},
	getOption: function(key) {
		var self = this;

		if (key && key.constructor === Object) {
			var _opt_ = $.extend({}, self.options); // clone options

			$.extend(_opt_, self.settings); // merge with settings default

			$.extend(_opt_, key); // merge options with settings custom

			// TODO: custom data/callback function - eg: onSlideBefore(), onSlideAfter(),...

			return _opt_;
		}
		else if (key in self.options) return self.options[key];
		else console.info("`" + key + "` is invalid");
	},
	getVersion: function(url, callback) {
		if (callback && callback.constructor == Function) {
			if (/^https?:?/i.test(location.protocol)) {
				var oReq = new XMLHttpRequest();

				oReq.addEventListener("load", function() {
					callback(this.responseText);
				});
				oReq.open("GET", url);
				oReq.send();
			}
			else callback();
		}
	},
	checkVersion: function(url) {
		var self = this;

		if (url) {
			var _versionStr_ = "unknown";
			if (self.version.release == _versionStr_) {
				if (url === true) url = "https://raw.githubusercontent.com/stevenwanderski/bxslider-4/master/dist/jquery.bxslider.js";

				self.getVersion(url, function(script) {
					var _versionMatch_ = script ? script.match(/\*\s*bxSlider\s+v?([^\n]+)$/gim) : [];

					if ($.isArray(_versionMatch_) && _versionMatch_.length > 0) {
						_versionStr_ = _versionMatch_[0].replace(/\*+/, "").replace(/bxSlider/i, "").trim().replace(/^v(\d+)/i, "$1").trim();

						self.version.release = _versionStr_

						return {
							current: self.version.current,
							release: self.version.release
						};
					}
				});
			}
			else {
				return {
					current: self.version.current,
					release: self.version.release
				};
			}
		}
		else {
			if (self.version.current) return self.version.current;
			else { // fetch
				$("script").each(function() {
					var _src_ = $(this).attr("src"),
						_match_ = _src_ ? _src_.match(/(jquery\.)?bxslider(\.min)?\.js/i) : [];

					if ($.isArray(_match_) && _match_.length > 0 && _match_.input) {
						var _versionStr_ = null;
						self.getVersion(_match_.input, function(script) {
							var _versionMatch_ = script ? script.match(/\*\s*bxSlider\s+v?([^\n]+)$/gim) : [];

							if ($.isArray(_versionMatch_) && _versionMatch_.length > 0) {
								_versionStr_ = _versionMatch_[0].replace(/\*+/, "").replace(/bxSlider/i, "").trim().replace(/^v(\d+)/i, "$1").trim();

								self.version.current = _versionStr_;

								self.checkVersion(true); // release

								return false;
							}
						});
					}
				});
			}
		}
	},
	options: { // default - https://bxslider.com/options/
		// general
		mode: "horizontal",
		speed: 500,
		slideMargin: 0,
		startSlide: 0,
		randomStart: false,
		slideSelector: "",
		infiniteLoop: true,
		hideControlOnEnd: false,
		easing: null,
		captions: false,
		ticker: false,
		tickerHover: false,
		adaptiveHeight: false,
		adaptiveHeightSpeed: 500,
		video: false,
		responsive: true,
		useCSS: true,
		preloadImages: "visible",
		touchEnabled: true,
		swipeThreshold: 50,
		oneToOneTouch: true,
		preventDefaultSwipeX: true,
		preventDefaultSwipeY: true,
		wrapperClass: "bx-wrapper",

		// pager
		pager: true,
		pagerType: "full",
		pagerShortSeparator: "/",
		pagerSelector: "",
		pagerCustom: null,
		buildPager: null,

		// controls
		controls: true,
		nextText: "Next",
		prevText: "Prev",
		nextSelector: null,
		prevSelector: null,
		autoControls: false,
		startText: "Start",
		stopText: "Stop",
		autoControlsCombine: false,
		autoControlsSelector: null,

		// auto
		auto: true,
		stopAutoOnClick: false,
		pause: 4000,
		autoStart: true,
		autoDirection: "next",
		autoHover: false,
		autoDelay: 0,

		// carousel
		minSlides: 1,
		maxSlides: 1,
		moveSlides: 0,
		slideWidth: 0,
		shrinkItems: false,

		// keyboard
		keyboardEnabled: false,

		// accessibility
		ariaLive: true,
		ariaHidden: true,

		// callbacks
		onSliderLoad: function(currentIndex) {
		},
		onSliderResize: function(currentIndex) {
		},
		onSlideBefore: function($slideElement, oldIndex, newIndex) {
		},
		onSlideAfter: function($slideElement, oldIndex, newIndex) {
		},
		onSlideNext: function($slideElement, oldIndex, newIndex) {
		},
		onSlidePrev: function($slideElement, oldIndex, newIndex) {
		}
	},
	settings: { // override default for FC
		// general
		mode: "fade",
		speed: 1000,
		slideMargin: 0,
		startSlide: 0,
		randomStart: false,
		infiniteLoop: true,
		hideControlOnEnd: false,
		easing: null,
		captions: false,
		ticker: false,
		tickerHover: false,
		adaptiveHeight: false,
		adaptiveHeightSpeed: 500,
		responsive: true,
		useCSS: true,
		preloadImages: "visible",
		touchEnabled: false,

		// auto
		auto: true,
		pause: 4000,
		autoDelay: 0,
		autoDirection: "next",
		autoHover: false,

		// controls
		controls: false,
		nextText: "",
		prevText: "",
		nextSelector: null,
		prevSelector: null,

		// carousel
		minSlides: 1,
		maxSlides: 1,
		moveSlides: 0,
		slideWidth: 0,

		// pager
		pager: false,
		pagerCustom: null,
		pagerSelector: null,

		// custom
		activePager: "before",
		activeSlider: "after",
		centerMode: false
	},
	_reload: function() {
		var self = this;

		$.each(self.data, function(i, data) {
			if (data.resize && data.__slider && data.__option) {
				self.data[i].__option.startSlide = data.__slider.getCurrentSlide(); // change start slide

				if (data.__swipe) {
					data.__slider.swipe("destroy");
					data.__slider.swipe(data.__swipe);
				}

				data.__slider.reloadSlider(self.data[i].__option);
			}
		});
	}
};



$(document)
	.ready(function() {
		if ($.fn.bxSlider) {
			var self = FCBase.bxSlider;

			self.checkVersion();



			// freeze it
			Object.freeze(FCBase.bxSlider.options);
			Object.freeze(FCBase.bxSlider.settings);
			Object.freeze(FCBase.bxSlider.getOption);
			Object.freeze(FCBase.bxSlider.getVersion);
			Object.freeze(FCBase.bxSlider.checkVersion);



			if (self.data && $.isArray(self.data) && self.data.length > 0) {
				var _consoleTouchSwipe_ = true;

				$.each(self.data, function(i, data) {
					var _selector_ = data.selector;

					if (_selector_) {
						var $selector = $(_selector_),
							getSlideWidth = function(options) { // https://github.com/stevenwanderski/bxslider-4/blob/master/dist/jquery.bxslider.js#L425-L444
								var newElWidth = options.slideWidth, // start with any user-supplied slide width
									wrapWidth = $selector.width(), // get the current viewport width
									minThreshold = (options.minSlides * options.slideWidth) + ((options.minSlides - 1) * options.slideMargin),
									maxThreshold = (options.maxSlides * options.slideWidth) + ((options.maxSlides - 1) * options.slideMargin),
									carousel = options.minSlides > 1 || options.maxSlides > 1;

								// if slide width was not supplied, or is larger than the viewport use the viewport width
								if (options.slideWidth === 0 || (options.slideWidth > wrapWidth && !carousel) || options.mode === "vertical") newElWidth = wrapWidth;
								else if (options.maxSlides > 1 && options.mode === "horizontal") { // if carousel, use the thresholds to determine the width
									if (wrapWidth > maxThreshold) return newElWidth;
									else if (wrapWidth < minThreshold) newElWidth = (wrapWidth - (options.slideMargin * (options.minSlides - 1))) / options.minSlides;
									else if (options.shrinkItems) newElWidth = Math.floor((wrapWidth + options.slideMargin) / (Math.ceil((wrapWidth + options.slideMargin) / (newElWidth + options.slideMargin))) - options.slideMargin);
								}

								return newElWidth;
							},
							getNumberSlidesShowing = function(options) { // https://github.com/stevenwanderski/bxslider-4/blob/master/dist/jquery.bxslider.js#L449-L470
								var slidesShowing = 1,
									childWidth = null,
									minThreshold = (options.minSlides * options.slideWidth) + ((options.minSlides - 1) * options.slideMargin),
									maxThreshold = (options.maxSlides * options.slideWidth) + ((options.maxSlides - 1) * options.slideMargin);

								if (options.mode === "horizontal" && options.slideWidth > 0) {
									if ($selector.width() < minThreshold) slidesShowing = options.minSlides; // if viewport is smaller than minThreshold, return minSlides
									else if ($selector.width() > maxThreshold) slidesShowing = options.maxSlides; // if viewport is larger than maxThreshold, return maxSlides
									else { // if viewport is between min / max thresholds, divide viewport width by first child width
										childWidth = $selector.children().first().width() + options.slideMargin;
										slidesShowing = Math.floor(($selector.width() + options.slideMargin) / childWidth) || 1;
									}
								}
								else if (options.mode === "vertical") slidesShowing = options.minSlides; // if "vertical" mode, slides showing will always be minSlides

								return slidesShowing;
							};

						if ($selector.length > 0) {
							var _opt_ = $.extend({}, self.options); // clone options

							/*
							// remove extend param
							$.each(data, function(k, param) {
								if (self.options[k] === undefined) delete data[k]; // TODO: don't remove it from global FCBase.bxSlider.data
							});
							*/

							if (data.ticker == true) {
								if ($.inArray(data.mode, ["horizontal", "vertical"]) < 0) data.mode = "horizontal";
								if (!data.auto) data.auto = false;
								if (!data.autoStart) data.autoStart = true;
								if (!data.autoDelay) data.autoDelay = 0;
								if (!data.autoHover) data.autoHover = false;
								if (data.tickerHover && data.useCSS === undefined) data.useCSS = true;
							}

							if (data.oneToOneTouch === undefined) data.oneToOneTouch = false;

							if (data.mode == "vertical") {
								if (data.preventDefaultSwipeY === undefined) data.preventDefaultSwipeY = false;
							}
							else {
								if (data.preventDefaultSwipeX === undefined) data.preventDefaultSwipeX = false;
							}

							$.extend(_opt_, self.settings); // merge with settings default
							$.extend(_opt_, data); // merge with data custom

							// build
							if (_opt_.centerMode) {
								/*
								// check if actual number of slides is less than minSlides / maxSlides
								if ($selector.children().length < _opt_.minSlides) _opt_.minSlides = $selector.children().length;
								if ($selector.children().length < _opt_.maxSlides) _opt_.maxSlides = $selector.children().length;


								var wWidth = $selector.outerWidth(),
									sWidth = $selector.children().outerWidth(),
									sMin = sWidth * _opt_.minSlides,
									sMax = sWidth * _opt_.maxSlides,
									space = 0;

								if (sMin > wWidth || sMax > wWidth) space = wWidth;
								else space = sMin;

								console.log(_opt_.minSlides, _opt_.maxSlides);
								console.log((wWidth - space) / 2);
								console.log({wWidth, sWidth, sMin, sMax, space});
								*/

								/*
								var vWidth = $selector.outerWidth(),
									iWidth = $selector.children().outerWidth(),
									iTotal = vWidth,
									minTotal = iWidth * _opt_.minSlides,
									maxTotal = iWidth * _opt_.maxSlides;

								if (vWidth > minTotal) iTotal = minTotal;
								else if (maxTotal > vWidth) iTotal = maxTotal;

								console.log(iTotal);
								*/

								$selector.css({
									marginLeft: "35%",
									marginRight: "35%"
								});
							}

							if (_opt_.pagerCustom && data.activePager === undefined) _opt_.activePager = "before";

							if (!_opt_.ticker) {
								$selector.children(".active").removeClass("active");

								if (_opt_.startSlide >= 0) $selector.children().eq(_opt_.startSlide).addClass("active");
								else $selector.children().first().addClass("active");
							}

							if (_opt_.activePager) {
								if (_opt_.pagerCustom) {
									if ($(_opt_.pagerCustom).find("a[data-slide-index]").length < 1) {
										$(_opt_.pagerCustom).data("t91__template--custom", true);

										if (_opt_.startSlide >= 0) $(_opt_.pagerCustom).children().eq(_opt_.startSlide).addClass("active");
										else $(_opt_.pagerCustom).children().first().addClass("active");
									}
								}
							}

							var $bxSlider = $selector.bxSlider(_opt_); // init

							self.data[i].__slider = $bxSlider; // assign slider

							_opt_.onSlideBefore = function($slideElement, oldIndex, newIndex) {
								if (FCBase.isFunction(data.onSlideBefore, true)) data.onSlideBefore($slideElement, oldIndex, newIndex); // apply

								if ((!_opt_.ticker && !_opt_.tickerHover) && _opt_.auto && !_opt_.stopAutoOnClick) self.data[i].__slider.stopAuto();

								if (_opt_.activePager == "before") {
									if (_opt_.pagerCustom && $(_opt_.pagerCustom).data("t91__template--custom")) {
										$(_opt_.pagerCustom).children().eq(oldIndex).removeClass("active");
										$(_opt_.pagerCustom).children().eq(newIndex).addClass("active");
									}
								}

								if (_opt_.activeSlider == "before") {
									$selector.children(".active").removeClass("active");
									$($slideElement).addClass("active");
								}
							};

							_opt_.onSlideAfter = function($slideElement, oldIndex, newIndex) {
								if (FCBase.isFunction(data.onSlideAfter, true)) data.onSlideAfter($slideElement, oldIndex, newIndex); // apply

								// adding to onSlideAfter's callback
								if ((!_opt_.ticker && !_opt_.tickerHover) && _opt_.auto && !_opt_.stopAutoOnClick) {
									self.data[i].__slider.stopAuto();
									self.data[i].__slider.startAuto();
								}

								if (_opt_.activePager == "after") {
									if (_opt_.pagerCustom && $(_opt_.pagerCustom).data("t91__template--custom")) {
										$(_opt_.pagerCustom).children().eq(oldIndex).removeClass("active");
										$(_opt_.pagerCustom).children().eq(newIndex).addClass("active");
									}
								}

								if (_opt_.activeSlider == "after") {
									$selector.children(".active").removeClass("active");
									$($slideElement).addClass("active");
								}
							};

							if (_opt_.pagerCustom) {
								$(_opt_.pagerCustom).children().on("click", function(e) {
									if ($(_opt_.pagerCustom).data("t91__template--custom")) {
										e.preventDefault();

										if (self.data[i].__slider) {
											var idx = $(this).attr("data-slide") ? parseInt($(this).attr("data-slide")) : $(this).index();

											if (self.data[i].__slider.getCurrentSlide() != idx) {
												$(this).siblings(".active").removeClass("active");
												$(this).addClass("active");

												self.data[i].__slider.goToSlide(idx);
											}
										}
									}
								});
							}





							self.data[i].__option = _opt_; // assign options
							self.data[i].__swipe = null;
							if (data.touchEnabled === true || data.touchEnabled === undefined) {
								if ($.fn.swipe && $.fn.swipe.constructor === Function) {
									self.data[i].__swipe = { // assign swipe
										swipe:function(e, direction, distance, duration, fingerCount, fingerData) {
											//console.log({e, direction, distance, duration, fingerCount, fingerData});
											//console.log("You swiped " + direction);

											if (self.data[i].__option.mode == "verical") {
												if (self.data[i].__option.autoDirection == "prev") {
													if (direction == "up") self.data[i].__slider.goToNextSlide();
													else if (direction == "down") self.data[i].__slider.goToPrevSlide();
												}
												else {
													if (direction == "up") self.data[i].__slider.goToPrevSlide();
													else if (direction == "down") self.data[i].__slider.goToNextSlide();
												}
											}
											else if (!self.data[i].__option.ticker) {
												if (self.data[i].__option.autoDirection == "prev") {
													if (direction == "left") self.data[i].__slider.goToPrevSlide();
													else if (direction == "right") self.data[i].__slider.goToNextSlide();
												}
												else {
													if (direction == "left") self.data[i].__slider.goToNextSlide();
													else if (direction == "right") self.data[i].__slider.goToPrevSlide();
												}
											}
										},
										threshold: data.swipeThreshold ? parseInt(data.swipeThreshold) : 0
									};

									$selector.swipe(self.data[i].__swipe);
								}
								else {
									if (self.data[i].__option.touchEnabled) {
										if (_consoleTouchSwipe_) console.log("Download TouchSwipe.js at https://github.com/mattbryson/TouchSwipe-Jquery-Plugin for option `touchEnabled: true`");

										_consoleTouchSwipe_ = false; // turn off console for TouchSwipe
									}
								}
							}

							self.data[i].__slider.reloadSlider(_opt_); // reload with custom callbacks
							self.data[i].__slider.goToSlide(_opt_.startSlide); // goto slide



							$("body")
								.on("mouseover", _selector_, function() {
									// if (self.data[i].__option.autoHover || (self.data[i].__option.ticker && self.data[i].__option.tickerHover)) self.data[i].__slider.stopAuto(), console.log("OVER");
									if (self.data[i].__option.autoHover) self.data[i].__slider.stopAuto(), console.log("OVER");
								})
								.on("mouseout", _selector_, function() {
									// if (self.data[i].__option.autoHover || (self.data[i].__option.ticker && self.data[i].__option.tickerHover)) self.data[i].__slider.startAuto(), console.log("OUT");
									if (self.data[i].__option.autoHover) self.data[i].__slider.startAuto(), console.log("OUT");
								});
						}
					}
					else console.log(data, "missing `selector`");
				});

				$(window)
					.resize(function() {
						if (FCBase.device.desktop) self._reload(); // only desktop
					})
					.on("orientationchange", function(e) {
						if (FCBase.device.mobile) self._reload(); // only mobile
					});
			}
		}
		else console.error("required libs `bxSlider.js`");
	});
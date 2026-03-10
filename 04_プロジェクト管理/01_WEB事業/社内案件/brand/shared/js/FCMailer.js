/*************************************************
 *  _____ ____ __  __       _ _           
 * |  ___/ ___|  \/  | __ _(_) | ___ _ __ 
 * | |_ | |   | |\/| |/ _` | | |/ _ \ '__|
 * |  _|| |___| |  | | (_| | | |  __/ |   
 * |_|   \____|_|  |_|\__,_|_|_|\___|_|   
 *
 **************************************************
 *
 * FCMailer - 2017
 *
 * ScriptName: FCMailer.js
 *
 * PackageName: FCMailer
 * Version: 3.8
 *
 * FoodConnection
 * http://foodconnection.jp/
 * http://foodconnection.vn/
 *
 ***************************************************/

"use strict";

var FCMailer = window.FCMailer || {};

FCMailer.version = 3.8;
FCMailer.debug = false;



var debugConfigBlur = true;

$(document)
	.ready(function() {
		if ($(".fc-form").attr("id") !== undefined) alert("[FCMailer] Error");

		$(".fc-form").each(function() {
			var idx = $(this).attr("data-index") !== undefined && $.trim($(this).attr("data-index")).length > 0 ? $.trim($(this).attr("data-index")).toLowerCase() : $(".fc-form").index($(this));

			FCMailer[idx] = {
				files: {},
				email: [],
				serializes: []
			};
		});

		/*
		// methods
		datetimepicker("validate");
		datetimepicker("setOptions");
		datetimepicker("getValue");
		datetimepicker("show");
		datetimepicker("hide");
		datetimepicker("toggle");
		datetimepicker("reset");
		datetimepicker("destroy");
		*/

		// auto parsed
		$(".fc-form")
			.find(".form-parse-text").each(function() {
				var $parse = $(this),
					parseHTML = "",
					parseContent = $.trim($parse.text()).length > 0 ? $.trim($parse.text()).split(/\r\n|\r|\n/ig) : "",
					parseName = $parse.attr("data-name") && $.trim($parse.attr("data-name")).length > 0 ? $.trim($parse.attr("data-name")).toLowerCase() : false, // string-key
					parseType = $parse.attr("data-type") && $.trim($parse.attr("data-type")).length > 0 ? $.trim($parse.attr("data-type")).toLowerCase() : false, // string-type
					parseActive = $parse.attr("data-active") && $.trim($parse.attr("data-active")).length > 0 ? $.trim($parse.attr("data-active")) : false, // number-index single/multiple
					parsePlaceholder = $parse.attr("data-placeholder") && $.trim($parse.attr("data-placeholder")).length > 0 ? $.trim($parse.attr("data-placeholder")) : false, // string-placeholder
					parseRequire = $parse.attr("data-require") && $.trim($parse.attr("data-require")).length > 0 ? $.trim($parse.attr("data-require")).operand() : false; // boolean

				if (!parseName) FCM.dataParseMissing("data-name", "form-parse-text");
				else if (!parseType) FCM.dataParseMissing("data-type", "form-parse-text");
				else {
					if (parseActive) {
						parseActive =
							parseActive
							.split(" ")
							.map(function (x) {
								return parseInt(x, 10); // number
							});
					}

					if (parseType == "select") {
						if (parseRequire) parseHTML += '<select name="' + parseName + '" class="require">';
						else parseHTML += '<select name="' + parseName + '">';
					} else if (parseType == "select-multiple") {
						if (parseRequire) parseHTML += '<select name="' + parseName + '" multiple="multiple" class="require">';
						else parseHTML += '<select name="' + parseName + '" multiple="multiple">';
					}

					for (var i in parseContent) {
						i = Number(i);

						var parseText = $.trim(parseContent[i]),
							parseAttr = [];

						if (parseText.length > 0) {
							if (parseType == "radio") {
								if (parseRequire) parseAttr.push('class="require"');
								if (parseActive && i == parseActive[0] - 1) parseAttr.push('checked="checked"');

								parseHTML += '<div class="parse-line">';
									parseHTML += '<label>';
										parseHTML += '<input type="' + parseType + '" name="' + parseName + '" value="' + parseText + '" ' + (parseAttr.length > 0 ? parseAttr.join(" ") + " " : "") + '/> ' + parseText;
									parseHTML += '</label>';
								parseHTML += '</div>';
							} else if (parseType == "checkbox") {
								if (parseRequire) parseAttr.push('class="require"');
								if (parseActive && $.inArray(i + 1, parseActive) >= 0) parseAttr.push('checked="checked"');

								parseHTML += '<div class="parse-line">';
									parseHTML += '<label>';
										parseHTML += '<input type="' + parseType + '" name="' + parseName + '" value="' + parseText + '" ' + (parseAttr.length > 0 ? parseAttr.join(" ") + " " : "") + '/> ' + parseText;
									parseHTML += '</label>';
								parseHTML += '</div>';
							} else if (parseType == "select") {
								if (parseText.toLowerCase() == "null") parseText = "";

								if (parseActive && i == parseActive[0] - 1) parseAttr.push('selected="selected"');

								parseHTML += '<option value="' + parseText + '"' + (parseAttr.length > 0 ? " " + parseAttr.join(" ") : "") + '>' + parseText + '</option>';
							} else if (parseType == "select-multiple") { // TODO: <optgroup>
								if (parseText.toLowerCase() == "null") parseText = "";

								if (parseActive && $.inArray(i + 1, parseActive) >= 0) parseAttr.push('selected="selected"');

								parseHTML += '<option value="' + parseText + '"' + (parseAttr.length > 0 ? " " + parseAttr.join(" ") : "") + '>' + parseText + '</option>';
							}
						}
					}

					if (parseType == "select" || parseType == "select-multiple") parseHTML += '</select>';

					// console.log(parseHTML);
					if (parseHTML.length > 0) {
						$parse
							.alterAttr("data-*") // cleaning attributes
							.html(parseHTML);
					}

					if (parsePlaceholder && (parseType == "select" || parseType == "select-multiple")) {
						if (parsePlaceholder.toLowerCase() == "null") parsePlaceholder = "";

						var $selector = $parse.find("select");
						$selector.find("option").removeAttr("selected");
						$selector.find("option:selected").prop("selected", false);
						$selector.prepend('<option value="" selected="selected">' + parsePlaceholder + '</option>');
						$selector.find("option").first().prop("selected", true);
					}
				}
			})
				.end() // traverse back
			.find(".form-parse-number").each(function() {
				var $parse = $(this),
					parseHTML = "",
					parseName = $parse.attr("data-name") && $.trim($parse.attr("data-name")).length > 0 ? $.trim($parse.attr("data-name")).toLowerCase() : false, // string-key
					parseType = $parse.attr("data-type") && $.trim($parse.attr("data-type")).length > 0 ? $.trim($parse.attr("data-type")).toLowerCase() : false, // string-type
					parseMin = $parse.attr("data-min") && $parse.attr("data-min").length > 0 ? Number($parse.attr("data-min")) : 0, // string-number
					parseMax = $parse.attr("data-max") && $parse.attr("data-max").length > 0 ? Number($parse.attr("data-max")) : false, // string-number
					parseStep = $parse.attr("data-step") && $parse.attr("data-step").length > 0 ? Number($parse.attr("data-step")) : 1, // string-number
					parseActive = $parse.attr("data-active") && $parse.attr("data-active").length > 0 ? $parse.attr("data-active") : false, // string/number
					parsePlaceholder = $parse.attr("data-placeholder") && $.trim($parse.attr("data-placeholder")).length > 0 ? $.trim($parse.attr("data-placeholder")) : false, // string-placeholder
					parseRequire = $parse.attr("data-require") && $.trim($parse.attr("data-require")).length > 0 ? $.trim($parse.attr("data-require")).operand() : false; // boolean

				if (!parseName) FCM.dataParseMissing("data-name", "form-parse-number");
				else if (!parseType) FCM.dataParseMissing("data-type", "form-parse-number");
				else if (!parseMax) FCM.dataParseMissing("data-max", "form-parse-number");
				else if (parseMin > parseMax) FCM.dataParseMissing("data-min-max", "form-parse-number");
				else {
					if (parseType != "checkbox") parseActive = Number(parseActive);

					if (parseStep <= 0) parseStep = 1;

					if (parseType == "number") parseHTML += '<input type="number" name="' + parseName + '" value="' + parseActive + '" min="' + parseMin + '" max="' + parseMax + '" step="' + parseStep + '"' + (parseRequire ? ' class="require"' : "") + ' />';
					else {
						if (parseActive && parseType == "checkbox") {
							parseActive =
								parseActive
								.split(" ")
								.map(function (x) {
									return parseInt(x, 10); // number
								});
						}
						if (parseType == "select") {
							if (parseRequire) parseHTML += '<select name="' + parseName + '" class="require">';
							else parseHTML += '<select name="' + parseName + '">';
						}

						var lst = [],
							i = parseMin;

						while (i <= parseMax) {
							lst.push(i);

							i += parseStep;
						};

						for (var i in lst) {
							var n = Number(lst[i]),
								parseAttr = [];

							if (parseType == "select") parseHTML += '<option value="' + n + '"' + (parseActive === n ? ' selected="selected"' : "") + '>' + n + '</option>';
							else if (parseType == "radio") {
								if (parseRequire) parseAttr.push('class="require"');
								if (n == parseActive) parseAttr.push('checked="checked"');

								parseHTML += '<div class="parse-line">';
									parseHTML += '<label>';
										parseHTML += '<input type="' + parseType + '" name="' + parseName + '" value="' + n + '" ' + (parseAttr.length > 0 ? parseAttr.join(" ") + " " : "") + '/> ' + n;
									parseHTML += '</label>';
								parseHTML += '</div>';

							} else if (parseType == "checkbox") {
								if (parseRequire) parseAttr.push('class="require"');
								if (parseActive && $.inArray(n, parseActive) >= 0) parseAttr.push('checked="checked"');

								parseHTML += '<div class="parse-line">';
									parseHTML += '<label>';
										parseHTML += '<input type="' + parseType + '" name="' + parseName + '" value="' + n + '" ' + (parseAttr.length > 0 ? parseAttr.join(" ") + " " : "") + '/> ' + n;
									parseHTML += '</label>';
								parseHTML += '</div>';
							}
						}

						if (parseType == "select") parseHTML += '</select>';
					}

					if (parseHTML.length > 0) {
						$parse
							.alterAttr("data-*") // cleaning attributes
							.html(parseHTML);
					}
				}
			})
				.end() // traverse back
			.find(".form-parse-date").each(function() {
				var $parse = $(this),
					parseData = parseOptionsDate($parse, true),
					parseOpt = parseOptionsDate($parse),
					parseLanguage = $parse.parents(".fc-form").first().attr("data-language");

				if (parseOpt) {
					if (parseLanguage && parseLanguage.length > 0) {
						if (parseLanguage.toLowerCase() == "jp") parseLanguage = "ja";
						else if (parseLanguage.toLowerCase() == "vn") parseLanguage = "vi";

						$.datetimepicker.setLocale(parseLanguage); // set language
					}

					if (parseData.inline === false) {
						$parse.html('<input type="text" name="' + parseData.name + '" value="' + (parseOpt.value ? parseOpt.value : "") + '" readonly="readonly" ' + (parseData.require ? 'class="require "' : "") + '/>');
						$parse.children("input").datetimepicker(parseOpt);

						$parse.children("input").datetimepicker("reset"); // fixed mask
					} else {
						if (parseData.require) $parse.addClass("require");

						$parse.datetimepicker(parseOpt);
					}

					$parse.alterAttr("data-*"); // clean attributes
				}
			})
				.end() // traverse back
			.find(".form-parse-time").each(function() {
				var $parse = $(this),
					parseData = parseOptionsTime($parse, true),
					parseOpt = parseOptionsTime($parse),
					parseLanguage = $parse.parents(".fc-form").first().attr("data-language");

				if (parseOpt) {
					if (parseLanguage && parseLanguage.length > 0) {
						if (parseLanguage.toLowerCase() == "jp") parseLanguage = "ja";
						else if (parseLanguage.toLowerCase() == "vn") parseLanguage = "vi";

						$.datetimepicker.setLocale(parseLanguage); // set language
					}

					if (parseData.inline === false) {
						$parse.html('<input type="text" name="' + parseData.name + '" value="' + (parseOpt.value ? parseOpt.value : "") + '" readonly="readonly" ' + (parseData.require ? 'class="require "' : "") + '/>');
						$parse.children("input").datetimepicker(parseOpt);

						$parse.children("input").datetimepicker("reset"); // fixed mask
					} else {
						if (parseData.require) $parse.addClass("require");

						$parse.datetimepicker(parseOpt);
					}

					$parse.alterAttr("data-*"); // clean attributes
				}
			})
				.end() // traverse back
			.find(".form-parse-datetime").each(function() {
				var $parse = $(this),
					pDate = {
						date: parseOptionsDate($parse, true),
						time: parseOptionsTime($parse, true)
					},
					pOpt = {
						date: parseOptionsDate($parse),
						time: parseOptionsTime($parse)
					},
					parseData = {},
					parseOpt = {},
					parseLanguage = $parse.parents(".fc-form").first().attr("data-language");

				if (pOpt.date || pOpt.time) {
					var oFormat = "",
						oValue = "";

					if (pDate.date.constructor === Object) $.extend(true, parseData, pDate.date);
					if (pDate.time.constructor === Object) $.extend(true, parseData, pDate.time);
					if (pOpt.date.constructor === Object) {
						$.extend(true, parseOpt, pOpt.date);

						if (pOpt.date.format) oFormat = pOpt.date.format;
						if (pOpt.date.value) oValue = pOpt.date.value;
					}
					if (pOpt.time.constructor === Object) {
						$.extend(true, parseOpt, pOpt.time);

						if (pOpt.time.format) {
							if (oFormat.length > 0) oFormat += " ";
							oFormat += pOpt.time.format;
						}

						if (pOpt.time.value) {
							if (oValue.length > 0) oValue += " ";
							oValue += pOpt.time.value;
						}
					}

					parseOpt.format = oFormat; // set format
					parseOpt.value = oValue; // set value

					parseOpt.datepicker = true; // active datepicker
					parseOpt.timepicker = true; // active timepicker

					if (parseLanguage && parseLanguage.length > 0) {
						if (parseLanguage.toLowerCase() == "jp") parseLanguage = "ja";
						else if (parseLanguage.toLowerCase() == "vn") parseLanguage = "vi";

						$.datetimepicker.setLocale(parseLanguage); // set language
					}

					if (parseData.inline === false) {
						$parse.html('<input type="text" name="' + parseData.name + '" value="' + (oValue ? oValue : "") + '" readonly="readonly" ' + (parseData.require ? 'class="require "' : "") + '/>');
						$parse.children("input").datetimepicker(parseOpt);

						$parse.children("input").datetimepicker("reset"); // fixed mask
					} else {
						if (parseData.require) $parse.addClass("require");

						$parse.datetimepicker(parseOpt);
					}

					$parse.alterAttr("data-*"); // clean attributes
				}

				// console.log(parseData);
				// console.log(parseOpt);
			})
				.end() // traverse back
			.find(".form-parse-date-range").each(function() {
			})
				.end() // traverse back
			.find(".form-parse-datetime-range").each(function() {
			})
				.end() // traverse back
			.find(".yubin-bango").each(function() {
				var $yubinBango = $(this),
					iCode = $yubinBango.attr("data-name-code") && $.trim($yubinBango.attr("data-name-code")).length > 0 ? $.trim($yubinBango.attr("data-name-code")).toLowerCase() : "",
					iLocate = $yubinBango.attr("data-name-locate") && $.trim($yubinBango.attr("data-name-locate")).length > 0 ? $.trim($yubinBango.attr("data-name-locate")).toLowerCase() : "",
					iRequire = $yubinBango.attr("data-require") && $.trim($yubinBango.attr("data-require")).length > 0 ? $.trim($yubinBango.attr("data-require")).operand() : false, // boolean
					iHTML = "";

				iHTML += '<div class="p-country-name">Japan</div>'; // Japan || JP || JPN|| JAPAN
				iHTML += '<div class="yubin-postal-code">';
					iHTML += '<div class="yubin-postal-mark">〒</div>';
					iHTML += '<div class="yubin-postal-input"><input type="text" name="' + iCode + '" size="8" maxlength="8" class="p-postal-code' + (iRequire ? " require" : "") + '" /></div>';
				iHTML += '</div>';
				iHTML += '<div class="yubin-locate">';
					iHTML += '<input type="text" name="' + iLocate + '" class="p-region p-locality p-street-address p-extended-address' + (iRequire ? " require" : "") + '" />';
				iHTML += '</div>';

				$yubinBango
					.html(iHTML)
					.addClass("h-adr")
					.alterAttr("data-*");
			})
				.end() // traverse back
			.find(".choice-date").each(function() {
				var $parse = $(this),
					parseName = $parse.attr("data-name") && $.trim($parse.attr("data-name")).length > 0 ? $.trim($parse.attr("data-name")).toLowerCase() : false, // string-key
					parseStart = $parse.attr("data-start") && $parse.attr("data-start").length > 0 ? Number($parse.attr("data-start")) : 0, // string-number
					parseHoliday = $parse.attr("data-holiday") && $.trim($parse.attr("data-holiday")).length > 0 ? $.trim($parse.attr("data-holiday")).toLowerCase() : false, // number-index
					parseHolidayHide = $parse.attr("data-holiday-hide") && $.trim($parse.attr("data-holiday-hide")).length > 0 ? $.trim($parse.attr("data-holiday-hide")).operand() : false, // boolean
					parseMax = $parse.attr("data-max") && $parse.attr("data-max").length > 0 ? Number($parse.attr("data-max")) : 3, // string-number
					parseActive = $parse.attr("data-active") && $parse.attr("data-active").length > 0 ? Number($parse.attr("data-active")) : false, // number
					parseText = $parse.attr("data-text") && $parse.attr("data-text").length > 0 ? $parse.attr("data-text") : "{YEAR}年{MONTH}月{DAY}日({WEEK})", // string
					parseGroup = $parse.attr("data-group") && $parse.attr("data-group").length > 0 ? $parse.attr("data-group") : "{YEAR}年{MONTH}月", // string
					parseWeek = $parse.attr("data-week") && $parse.attr("data-week").length > 0 ? $parse.attr("data-week") : "日|月|火|水|木|金|土", // string
					parsePlaceholder = $parse.attr("data-placeholder") && $.trim($parse.attr("data-placeholder")).length > 0 ? $.trim($parse.attr("data-placeholder")) : false, // string-placeholder
					parseRequire = $parse.attr("data-require") && $.trim($parse.attr("data-require")).length > 0 ? $.trim($parse.attr("data-require")).operand() : false, // boolean
					parseHTML = "";

				if (!parseName) FCM.dataParseMissing("data-name", "choice-date");
				else {
					if (parseMax < 1) parseMax = 1;
					if (parseActive !== false && parseActive > 0) parseActive++;

					var i = 1,
						x = 0,
						arrWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
						arrStyle = ["cd-sun", "cd-mon", "cd-tue", "cd-wed", "cd-thu", "cd-fri", "cd-sat"],
						arrHoliday = [],
						weekName = [],
						timestamp = 24 * 60 * 60 * 1000,
						today = new Date((new Date()).getTime() + parseStart * timestamp);

					if (parseHoliday) {
						var holiday = parseHoliday.split(" ");

						for (var a in holiday) {
							arrHoliday.push($.inArray(holiday[a], arrWeek));
						}
					}

					parseWeek = parseWeek.replace(/｜/g, "|");
					weekName = parseWeek.split("|");

					parseHTML += '<select name="' + parseName + '"' + (parseRequire ? ' class="require"' : '') + '>';
						if (parsePlaceholder) parseHTML += '<option value="" readonly="readonly">' + parsePlaceholder + '</option>';

						do {
							var dateGroup = parseGroup;

							dateGroup =
								dateGroup
									.replace(/\{YEAR\}/ig, today.getFullYear())
									.replace(/\{MONTH\}/ig, (today.getMonth() + 1).zeroPad(2));

							parseHTML += '<optgroup label="' + dateGroup + '">';
								for (var z = today.getDate(); z <= today.monthDays(); z++) {
									var year = today.getFullYear(),
										month = today.getMonth() + 1,
										day = today.getDate(),
										week = today.getDay(),
										dateValue = year + "-" + month.zeroPad(2) + "-" + day.zeroPad(2),
										dateText = parseText;

									dateText =
										dateText
											.replace(/\{YEAR\}/ig, year)
											.replace(/\{MONTH\}/ig, month.zeroPad(2))
											.replace(/\{DAY\}/ig, day.zeroPad(2))
											.replace(/\{WEEK\}/ig, weekName[week]);

										parseHTML += '<option value="' + dateValue + '" class="' + arrStyle[week] + ($.inArray(week, arrHoliday) >= 0 && parseHolidayHide ? ' cd-hide' : '') + '"' + ($.inArray(week, arrHoliday) >= 0 ? ' disabled="disabled"' : '') + (parseActive === x ? ' selected="selected"' : '') + '>' + dateText + '</option>';

									today.setDate(today.getDate() + 1);

									x++;
								}
							parseHTML += '</optgroup>';

							i++;
						} while (i <= parseMax);
					parseHTML += '</select>';

					$parse.html(parseHTML);
					if (parseActive === false) {
						$parse
							.children("select")
								.children("option")
									.first()
									.attr("selected", "selected")
									.prop("selected", true);
					}
					$parse.alterAttr("data-*"); // clean attributes
				}
			})
				.end() // traverse back
			.find(":input:file").each(function() {
				var idx = $(this).parents(".fc-form").attr("data-index") !== undefined && $.trim($(this).parents(".fc-form").attr("data-index")).length > 0 ? $.trim($(this).parents(".fc-form").attr("data-index")).toLowerCase() : $(".fc-form").index($(this).parents(".fc-form"));
				if (FCMailer[idx] === undefined) FCMailer[idx] = {};
				if (FCMailer[idx].files === undefined) FCMailer[idx].files = {};

				var $aFile = $(this),
					$aInput = $("<div />").append($aFile.clone(true, true)),
					aName = $(this).attr("name"),
					aPlaceholder = $aFile.attr("placeholder") && $.trim($aFile.attr("placeholder")).length > 0 ? $.trim($aFile.attr("placeholder")) : "Browse...",
					aHTML = "";

				if (aName) aName = aName.replace(/(\[.*\])*$/, "");

				FCMailer[idx].files[aName] = {};

				$aInput.removeAttr("placeholder");

				if ($aFile.attr("multiple")) {
					aHTML += '<div class="form-attachment multiple">';
						aHTML += '<div class="attachment-button">';
							aHTML += '<div class="attachment-browse">' + aPlaceholder + '</div>';
							aHTML += $aInput.html();
						aHTML += '</div>';
						aHTML += '<div class="attachment-list"></div>';
					aHTML += '</div>';
				} else {
					aHTML += '<div class="form-attachment">';
						aHTML += '<div class="attachment-preview">';
							aHTML += '<div class="attachment-remove"></div>';
						aHTML += '</div>';
						aHTML += '<div class="attachment-main">';
							aHTML += '<div class="attachment-button">';
								aHTML += '<div class="attachment-browse">' + aPlaceholder + '</div>';
								aHTML += $aInput.html();
							aHTML += '</div>';
							aHTML += '<div class="attachment-caption"><input type="text" value="" readonly="readonly" /></div>';
						aHTML += '</div>';
					aHTML += '</div>';
				}

				$aFile.replaceWith(aHTML);
			})
				.end() // traverse back
			.find(".error-length").each(function() {
				$(this).data("txt-length", $(this).html());
			});



		// caching values default
		$(":input").each(function() {
			$(this).data("fc-remember", $(this).val());
		});

		$("body")
			.on("change", ".fc-form .form-attachment :input:file", function(e) {
				var idx = $(this).parents(".fc-form").attr("data-index") !== undefined && $.trim($(this).parents(".fc-form").attr("data-index")).length > 0 ? $.trim($(this).parents(".fc-form").attr("data-index")).toLowerCase() : $(".fc-form").index($(this).parents(".fc-form")),
					aName = $(this).attr("name");

				if (aName) aName = aName.replace(/(\[.*\])*$/, "");

				if (FCMailer[idx] === undefined) FCMailer[idx] = {};
				if (FCMailer[idx].files === undefined) FCMailer[idx].files = {};
				if (FCMailer[idx].files[aName] === undefined) FCMailer[idx].files[aName] = {};

				var $aInput = $(this),
					$aForm = $aInput.parents(".form-attachment").first();

				if (!$aForm.hasClass("multiple") && e.target.files.length < 1) $aForm.find(".attachment-remove").click();

				if (window.File && window.FileReader && window.FileList && window.Blob) {
					for (var i = 0; i <= e.target.files.length; i++) {
						if (e.target.files[i]) {
							var iFile = e.target.files[i],
								iReader = new FileReader();

							iReader.onload = (function(item) { // closure to capture the file information
								return function(evt) {
									var filename = item.name,
										filetype = item.type,
										filesize = item.size,
										filedate = item.lastModifiedDate,
										filepreview = false,
										uDate = new Date(),
										uid = [
											uDate.getYear(),
											uDate.getMonth(),
											uDate.getDate(),
											uDate.getHours(),
											uDate.getMinutes(),
											uDate.getSeconds(),
											uDate.getMilliseconds(),
											Math.floor(Math.random() * 1000 + 100) // random number
										].join("");

									if (/^image\/(png|jpg|jpeg|gif)$/i.test(filetype)) filepreview = '<img src="' + evt.target.result + '" alt="' + escape(filename) + '" class="hide-visibility" />';
									else {
										var name = $.trim(filename).replace(/(.*?)(\.([a-z0-9]+))$/i, "$3");
										if (name) name = name.length == 4 ? name.slice(0, 4) : name.slice(0, 3);

										filepreview = '<span class="hide-visibility">' + escape(name) + '</span>';
									}

									if ($aForm.hasClass("multiple")) {
										var aHTML = "";
										aHTML += '<div class="attachment-item hide-visibility">';
											aHTML += '<div class="attachment-block">';
												aHTML += '<div class="attachment-preview">' + filepreview + '</div>';
												aHTML += '<div class="attachment-main">';
													aHTML += '<div class="attachment-caption"><input type="text" value="' + decodeURI(filename) + '" readonly="readonly" /></div>';
													aHTML += '<div class="attachment-remove"></div>';
												aHTML += '</div>';
											aHTML += '</div>';
										aHTML += '</div>';

										$aForm.find(".attachment-list").prepend(aHTML);
										$aForm.find(".attachment-list").children().first().data("fc-file", uid);

										setTimeout(function() {
											$aForm.find(".attachment-list").children(".attachment-item.hide-visibility").stop().slideDown(300, function() {
												var $aItem = $(this);

												$aItem
													.removeAttr("style")
													.removeClass("hide-visibility");

												setTimeout(function() {
													if ($aItem.find(".attachment-preview").children("img").length > 0) {
														$aItem
															.find("img")
															.removeClass("hide-visibility");
													} else {
														$aItem
															.find("span")
															.removeClass("hide-visibility");
													}
												}, 50);
											});
										}, 50);
									} else {
										FCMailer[idx].files[aName] = {}; // reset
										$aForm.data("fc-file", uid);
										if ($aForm.find(".attachment-preview").children("img").length > 0) $aForm.find(".attachment-preview").children("img").remove();
										if ($aForm.find(".attachment-preview").children("span").length > 0) $aForm.find(".attachment-preview").children("span").remove();

										$aForm
											.find(".attachment-preview")
												.prepend(filepreview);

										$aForm
											.find(".attachment-caption")
												.children("input")
												.replaceWith('<input type="text" value="' + decodeURI(item.name) + '" readonly="readonly" />'); // fix - cloned

										setTimeout(function() {
											if ($aForm.find(".attachment-preview").children("img").length > 0) {
												$aForm
													.find(".attachment-preview")
													.children("img")
													.removeClass("hide-visibility");
											} else {
												$aForm
													.find(".attachment-preview")
													.children("span")
													.removeClass("hide-visibility");
											}
										}, 50);
									}

									FCMailer[idx].files[aName][uid] = item;
								};
							})(iFile);
							iReader.onerror = function(evt) {
								switch(evt.target.error.code) {
									case evt.target.error.NOT_FOUND_ERR:
										console.warn("File Not Found!");
										break;
									case evt.target.error.NOT_READABLE_ERR:
										console.warn("File is not readable");
										break;
									case evt.target.error.ABORT_ERR:
										console.warn("File is aborted!");
										break; // noop
									default:
										console.warn("An error occurred reading this file.");
								};
							};
							iReader.onabort = function(evt) {
								console.warn("File read cancelled!");
							};
							iReader.onprogress = function(evt) {
							};
							iReader.onloadstart = function(evt) {
							};
							iReader.onloadend = function(evt) {
								if (evt.target.readyState == FileReader.DONE) {
									// console.log(evt.target.result);
								}
							};

							iReader.readAsDataURL(iFile);
						}
					}
				} else console.warn("[FCMailer] The File APIs are not fully supported in this browser.");
			})
			.on("click", ".fc-form .form-attachment .attachment-remove", function(e) {
				e.preventDefault();

				var idx = $(this).parents(".fc-form").attr("data-index") !== undefined && $.trim($(this).parents(".fc-form").attr("data-index")).length > 0 ? $.trim($(this).parents(".fc-form").attr("data-index")).toLowerCase() : $(".fc-form").index($(this).parents(".fc-form")),
					aName = $(this).parents(".form-attachment").find(":input:file").attr("name");

				if (aName) aName = aName.replace(/(\[.*\])*$/, "");

				if (FCMailer[idx] === undefined) FCMailer[idx] = {};
				if (FCMailer[idx].files === undefined) FCMailer[idx].files = {};
				if (FCMailer[idx].files[aName] === undefined) FCMailer[idx].files[aName] = {};

				if ($(this).parents(".form-attachment").hasClass("multiple")) {
					$(this).parents(".attachment-item").first().stop().slideUp(300, function() {
						var uid = $(this).data("fc-file");
						if (FCMailer[idx].files[aName] && FCMailer[idx].files[aName][uid]) delete FCMailer[idx].files[aName][uid];

						$(this).remove();
					});
				} else {
					var $iPreview = $(this).parents(".attachment-preview").first(),
						$iChild = $iPreview.children("img").length > 0 ? $iPreview.children("img") : $iPreview.children("span"),
						$aMain = $iPreview.siblings(".attachment-main"),
						$aFile = $aMain.find(":input:file"),
						$aInput = $aMain.find(".attachment-caption").children("input"),
						uid = $(this).parents(".form-attachment").data("fc-file");

					if (FCMailer[idx].files[aName] && FCMailer[idx].files[aName][uid]) delete FCMailer[idx].files[aName][uid];

					$aInput.get(0).defaultValue = "";
					$aInput.replaceWith($aInput.val("").clone(true, true));
					$aFile.replaceWith($aFile.val("").clone(true, true));

					$iChild.addClass("hide-visibility");
					setTimeout(function() {
						$iChild.remove();
					}, 50);
				}
			})
			.on("click", ".fc-form .form-attachment .attachment-preview", function(e) {
				var $aForm = $(this).parents(".form-attachment").first();

				if ($(e.target).hasClass("attachment-preview") && !$aForm.hasClass("multiple") && $(this).children("img").length < 1 && $(this).children("span").length < 1) $aForm.find(":input:file").trigger("click");
			})
			.on("click", ".fc-form .form-attachment .attachment-browse", function(e) { // attachment browse file
				e.preventDefault();

				$(this).siblings(":input:file").trigger("click");
			})
			.on("submit", ".fc-form form, .fc-confirm form, .fc-form :button:submit, .fc-confirm :button:submit", function(e) { // prevent submitted
				e.preventDefault();
			})
			.on("click", ".fc-form .form-submit", function(e) { // form submit
				e.preventDefault();

				console.clear();

				var $form = $(this).parents(".fc-form"),
					__form__ = {};

				__form__.idx = $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form);
				__form__.error = false;
				__form__.offset = false;
				__form__.display = $form.attr("data-display") !== undefined && $.trim($form.attr("data-display")).length > 0 && $.inArray($.trim($form.attr("data-display")).toLowerCase(), ["slide", "fade", "show", "fixed"]) >= 0 ? $.trim($form.attr("data-display")).toLowerCase() : "fixed";
				__form__.root = $form.attr("data-root") !== undefined && $.trim($form.attr("data-root")).length > 0 ? $.trim($form.attr("data-root")).toLowerCase() : false;
				__form__.email = $form.attr("data-email") !== undefined && $.trim($form.attr("data-email")).length > 0 ? $.trim($form.attr("data-email")).toLowerCase() : false;
				__form__.language = $form.attr("data-language") !== undefined && $.trim($form.attr("data-language")).length > 0 ? $.trim($form.attr("data-language")).toLowerCase() : false;
				__form__.multiple = $form.attr("data-multiple") !== undefined && $.trim($form.attr("data-multiple")).length > 0 ? $.trim($form.attr("data-multiple")).toLowerCase() : false;
				__form__.keep = $form.attr("data-keep") !== undefined && $.trim($form.attr("data-keep")).length > 0 ? $.trim($form.attr("data-keep")).operand() : true;
				__form__.debug = $form.attr("data-debug") !== undefined && $.trim($form.attr("data-debug")).length > 0 ? $.trim($form.attr("data-debug")).operand() : false;
				__form__.confirm = $form.attr("data-confirm") !== undefined && $.trim($form.attr("data-confirm")).length > 0 ? $.trim($form.attr("data-confirm")).operand() : true;
				__form__.radio = {};
				__form__.checkbox = {};
				__form__.serialize = {};
				__form__.removed = [];
				__form__.files = [];

				// reset
				if (FCMailer[__form__.idx] === undefined) FCMailer[__form__.idx] = {};
				FCMailer[__form__.idx].email = [];
				FCMailer[__form__.idx].serializes = [];

				$form.find("[class^='error']").hide();
				$form.nextAll(".fc-confirm").remove();

				// validate
				$form.find(":input").each(function() {
					var $formInput = $(this),
						$formRow = $formInput.parents(".form-row").first(),
						$formValue = $formInput.parents(".form-value").first(),
						iName = $formInput.attr("name"),
						iValue = $.trim($formInput.val());

					if ($formInput.hasClass("form-submit") || $formInput.hasClass("form-back") || ($formInput.attr("readonly") && !$formInput.hasClass("require"))) return;

					if ($formRow.length < 1) FCM.rowMissing(iName);

					if ($formInput.hasClass("require")) {
						var $elmError = $formRow.find(".error").first();
						if ($formValue.find(".error").first().length > 0) $elmError = $formValue.find(".error").first();
						else if ($formValue.siblings(".error").length > 0) $elmError = $formValue.siblings(".error");

						if ($elmError.length < 1) FCM.errorMissing(iName, "error");

						if ($formInput.is(":radio")) {
							if (__form__.radio[iName] === undefined) __form__.radio[iName] = false;
							if ($formInput.is(":checked")) __form__.radio[iName] = true;

							if ($formValue.find("input[name='" + iName + "']:checked").length < 1 && __form__.radio[iName] === false) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						} else if ($formInput.is(":checkbox")) {
							if (__form__.checkbox[iName] === undefined) __form__.checkbox[iName] = false;
							if ($formInput.is(":checked")) __form__.checkbox[iName] = true;

							if ($formValue.find("input[name='" + iName + "']:checked").length < 1 && __form__.checkbox[iName] === false) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						} else if ($formInput.is("select")) {
							if ($("option:disabled", this).is(":selected") || iValue.length < 1) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						} else {
							if (iValue.length < 1) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						}
					}

					if ($formInput.hasClass("check-phone")) {
						var phoneNumber = iValue.replace(/[\-\s\.\(\)\+]+/g, "");

						var $elmError = $formRow.find(".error-phone").first();
						if ($formValue.find(".error-phone").first().length > 0) $elmError = $formValue.find(".error-phone").first();
						else if ($formValue.siblings(".error-phone").length > 0) $elmError = $formValue.siblings(".error-phone");

						if ($elmError.length < 1) FCM.errorMissing(iName, "error-phone");

						if (iValue.length > 0 && (!/^[(]?[\+]?[0-9]{1,5}[)]?[\-\s\.]?[0-9]{2,5}[\-\s\.]?[0-9]{2,5}[\-\s\.]?[0-9]{2,7}$/.test(iValue) || phoneNumber.length < 10 || phoneNumber.length > 15)) {
							$elmError.show();

							__form__.error = true;
							if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
						}
					}

					if ($formInput.hasClass("check-email")) {
						var $elmError = $formRow.find(".error-email").first();
						if ($formValue.find(".error-email").first().length > 0) $elmError = $formValue.find(".error-email").first();
						else if ($formValue.siblings(".error-email").length > 0) $elmError = $formValue.siblings(".error-email");

						if ($elmError.length < 1) FCM.errorMissing(iName, "error-email");

						if (iValue.length > 0 && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(iValue)) {
							$elmError.show();

							__form__.error = true;
							if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
						}
					}

					if ($formInput.hasClass("check-number")) {
						var $elmError = $formRow.find(".error-number").first();
						if ($formValue.find(".error-number").first().length > 0) $elmError = $formValue.find(".error-number").first();
						else if ($formValue.siblings(".error-number").length > 0) $elmError = $formValue.siblings(".error-number");

						if ($elmError.length < 1) FCM.errorMissing(iName, "error-number");

						if (iValue.length > 0 && !/^\d+$/.test(iValue)) {
							$elmError.show();

							__form__.error = true;
							if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
						}
					}

					// check postal-code
					// /^([0-9]){3}[-]([0-9]){4}$/

					if ($formValue.attr("data-match") && $.trim($formValue.attr("data-match")).length > 0) {
						var $matchInput = $form.find("input[name='" + $.trim($formValue.attr("data-match")).toLowerCase() + "']");

						var $elmError = $formRow.find(".error-match").first();
						if ($formValue.find(".error-match").first().length > 0) $elmError = $formValue.find(".error-match").first();
						else if ($formValue.siblings(".error-match").length > 0) $elmError = $formValue.siblings(".error-match");

						if ($elmError.length < 1) FCM.errorMissing(iName, "error-match");
						if ($matchInput.length < 1) FCM.matchMissing($.trim($formValue.attr("data-match")).toLowerCase());
						else {
							if ($matchInput.val().length > 0 && $matchInput.val() !== iValue) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						}
					}

					if (($formValue.attr("data-min") && $.trim($formValue.attr("data-min")).length > 0) || ($formValue.attr("data-max") && $.trim($formValue.attr("data-max")).length > 0)) {
						var $elmError = $formRow.find(".error-length").first();
						if ($formValue.find(".error-length").first().length > 0) $elmError = $formValue.find(".error-length").first();
						else if ($formValue.siblings(".error-length").length > 0) $elmError = $formValue.siblings(".error-length");

						var iTotal = iValue.length,
							iMin = parseInt($.trim($formValue.attr("data-min"))),
							iMax = parseInt($.trim($formValue.attr("data-max")));

						if ($elmError.length < 1) FCM.errorMissing(iName, "error-length");
						else {
							var txtMsg = $elmError.html();
							if ($elmError.data("txt-length")) txtMsg = $elmError.data("txt-length");

							txtMsg =
								txtMsg
								.replace(/\{min\}/i, iMin)
								.replace(/\{max\}/i, iMax);

							$elmError.html(txtMsg);
						}

						if ($formInput.is(":file") && $formInput.attr("multiple")) iTotal = $formInput.parents(".form-attachment").first().find(".attachment-list").children(".attachment-item").length;
						else if ($formInput.is(":checkbox")) iTotal = $formValue.find("input[name='" + iName + "']:checked").length;
						else if ($formValue.attr("data-count") !== undefined) { // default - letter
							if ($formValue.attr("data-count").toLowerCase() == "number") iTotal = iTotal > 0 ? Number(iValue) : 0;
							else if ($formValue.attr("data-count").toLowerCase() == "word") iTotal = iTotal > 0 ? iValue.split(" ").length : 0;
						}

						if ($formValue.attr("data-min") && $.trim($formValue.attr("data-min")).length > 0) {
							if (isNaN(iTotal) || (iTotal > 0 && iTotal < iMin)) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						}

						if ($formValue.attr("data-max") && $.trim($formValue.attr("data-max")).length > 0) {
							if (isNaN(iTotal) || (iTotal > 0 && iTotal > iMax)) {
								$elmError.show();

								__form__.error = true;
								if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
							}
						}
					}
				});

				if (__form__.email === false) __form__.email = "email"; // default
				if (__form__.email) {
					var fields = __form__.email.split(" ");

					for (var i in fields) {
						var iName = fields[i],
							$formInput = $form.find(":input[name='" + iName + "']");

						if ($formInput.length > 0) {
							if ($formInput.hasClass("check-email")) break;
							else {
								var iValue = $formInput.val(),
									$formRow = $formInput.parents(".form-row").first(),
									$formValue = $formInput.parents(".form-value").first();

								var $elmError = $formRow.find(".error-email").first();
								if ($formValue.find(".error-email").first().length > 0) $elmError = $formValue.find(".error-email").first();
								else if ($formValue.siblings(".error-email").length > 0) $elmError = $formValue.siblings(".error-email");

								if ($elmError.length < 1) FCM.errorMissing(iName, "error-email");

								if (iValue.length > 0 && !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(iValue)) {
									$elmError.show();

									__form__.error = true;
									if ($formRow.length > 0 && __form__.offset === false) __form__.offset = $formRow.offset().top;
								}
							}
						}
					}
				}

				// console.log(__form__);



				if (__form__.offset === false) __form__.offset = $form.offset().top;
				if ($(".fc-nav-fixed").length > 0) __form__.offset -= $(".fc-nav-fixed").outerHeight();

				if (__form__.error) { // error
					$("html, body").stop().animate({
						scrollTop: __form__.offset
					}, 300);
				} else { // continue
					if (FCMailer[__form__.idx] === undefined) FCMailer[__form__.idx] = {};
					if (FCMailer[__form__.idx].email === undefined) FCMailer[__form__.idx].email = [];
					if (FCMailer[__form__.idx].serializes === undefined) FCMailer[__form__.idx].serializes = [];

					__form__.serialize = {};
					__form__.removed = [];

					// get value
					$form.find("[data-for]").each(function() {
						var $elm = $(this),
							$formRow = $elm.hasClass("form-row") ? $elm : $elm.parents(".form-row").first(),
							joinGroup = $elm.attr("data-join"),
							key = $.trim($elm.attr("data-for")).toLowerCase(),
							arrs = key.split(" "),
							aValue = [];

						// console.log(arrs);

						for (var i in arrs) {
							if (arrs[i].length > 0) {
								var $formInput = $formRow.find(":input[name='" + arrs[i] + "']").length > 0 ? $formRow.find(":input[name='" + arrs[i] + "']") : $formRow.find(":input[name='" + arrs[i] + "[]']"),
									$formValue = $formInput.parents(".form-value").first(),
									joinValue = $formValue.attr("data-join");

								if ($formValue.siblings(".form-value").length < 1 && joinValue !== undefined && $.trim(joinValue).length > 0) joinGroup = joinValue; // single :input

								if (!$formRow.hasClass("form-remove") && !$formValue.attr("data-match")) {
									if ($formInput.length > 0) {
										if ($formInput.is(":file")) __form__.files.push(arrs[i]);
										else {
											if (joinValue !== undefined && $.trim(joinValue).toLowerCase() == "br") joinValue = "\n";

											var mValue = false;
											if ($formInput.is(":checkbox")) {
												var cValue = [];
												$formRow.find(":input[name='" + arrs[i] + "']:checked").each(function() {
													cValue.push($(this).val());
												});

												mValue = cValue.join(joinValue);
											} else if ($formInput.is(":radio")) mValue = $formRow.find(":input[name='" + arrs[i] + "']:checked").val();
											else if ($formInput.is("select") && $formInput.attr("multiple")) mValue = $formInput.val().join(joinValue);
											// else mValue = $formInput.val();
											else if ($formInput.val().length > 0 || __form__.keep) mValue = $formInput.val();

											// adding value - value
											if (mValue) {
												if ($.trim($formValue.attr("data-before"))) mValue = $.trim($formValue.attr("data-before")) + " " + mValue;
												if ($.trim($formValue.attr("data-after"))) mValue += " " + $.trim($formValue.attr("data-after"));
											} else if ($formValue.attr("data-empty") && $.trim($formValue.attr("data-empty")).length > 0) mValue = $.trim($formValue.attr("data-empty")).operand();

											// aValue.push(mValue); // push data
											if (mValue) aValue.push(mValue); // push data
										}
									} else FCM.inputMissing(key); // invalid structure
								} else __form__.removed.push(arrs[i]);
							}
						}

						if (aValue.length > 0) {
							if (joinGroup !== undefined && $.trim(joinGroup).toLowerCase() == "br") joinGroup = "\n";

							aValue = aValue.join(joinGroup);
						} else if ($formRow.attr("data-empty") && $.trim($formRow.attr("data-empty")).length > 0) aValue = $.trim($formRow.attr("data-empty")).operand();
						else aValue = null;

						// adding value - group
						if (aValue !== null && $.trim($elm.attr("data-before"))) aValue = $.trim($elm.attr("data-before")) + " " + aValue;
						if (aValue !== null && $.trim($elm.attr("data-after"))) aValue += " " + $.trim($elm.attr("data-after"));

						if ($.inArray(key, __form__.removed) < 0 && $.inArray(key, __form__.files) < 0) {
							FCMailer[__form__.idx].serializes.push({
								key: key,
								txt: $elm.text(),
								value: aValue
							});

							__form__.serialize[key] = aValue;
						}
					});

					if (__form__.confirm === false) FCM.send($form, __form__);
					else {
						var $formClone = $("<div />").append($form.clone(true, true));

						$formClone = $formClone.children(); // itself
						$formClone.children().wrapAll('<div class="confirm-main" />');

						// cleaning
						$formClone
							.removeClass("fc-form")
							.addClass("fc-confirm")
								.find(".confirm-hide")
									.remove()
									.end() // traverse back
								.find(".form-remove")
									.remove()
									.end() // traverse back
								.find(".submit-form")
									.remove()
									.end() // traverse back
								.find("[class^='error']")
									.remove()
									.end() // traverse back
								.find("script")
									.remove()
									.end(); // traverse back

						// parsing value
						$formClone.find("[data-for]").each(function() {
							var $elm = $(this),
								$formRow = $elm.hasClass("form-row") ? $elm : $elm.parents(".form-row").first(),
								key = $.trim($elm.attr("data-for")).toLowerCase(),
								arrs = key.split(" ");

							for (var i in arrs) {
								if (arrs[i].length > 0) {
									// if (arrs[i].length > 1 && Number(i) > 0) continue;

									var $formInput = $formRow.find(":input[name='" + arrs[i] + "']").length > 0 ? $formRow.find(":input[name='" + arrs[i] + "']") : $formRow.find(":input[name='" + arrs[i] + "[]']"),
										$formTag = $formInput.length > 0 ? $formInput.get(0).nodeName.toLowerCase() : false,
										$formType = $formTag == "input" ? $formInput.attr("type") : false,
										$formValue = $formInput.parents(".form-value").first(),
										iValue = __form__.serialize[key] !== undefined ? (__form__.serialize[key] + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2') : false;

/*
https://www.w3schools.com/tags/tag_input.asp

button
checkbox
color
date 
datetime-local 
email 
file
hidden
image
month 
number 
password
radio
range 
reset
search
submit
tel
text
time 
url
week
*/

									if ($formInput.length > 0) {
										if ($formInput.parents(".form-attachment").first().length > 0) {
											var aName = arrs[i].replace(/(\[.*\])*$/, "");
											if (FCMailer[__form__.idx] === undefined) FCMailer[__form__.idx] = {};
											if (FCMailer[__form__.idx].files === undefined) FCMailer[__form__.idx].files = {};

											if (__form__.keep === false && FCMailer[__form__.idx].files[aName] && Object.keys(FCMailer[__form__.idx].files[aName]).length < 1) {
												var $aForm = $formInput.parents(".form-attachment").first(),
													$aPreview = $aForm.find(".attachment-preview");

												if ($aForm.hasClass("multiple") && $aForm.find(".attachment-list").children().length < 1) $formRow.remove();
												else if ($aPreview.children("img").length < 1 && $aPreview.children("span").length < 1) $formRow.remove();
											}
										} else {
											if (arrs[i].length > 1 && Number(i) > 0 && $formValue.siblings(".form-value").length > 0) $formValue.remove();
											else if ($formRow.hasClass("form-remove") || ($formValue.attr("data-match") && $.trim($formValue.attr("data-match")).length > 0)) {
												if ($formValue.parents(".form-remove").first().length > 0) $formValue.parents(".form-remove").first().remove(); // ???
												else $formRow.remove();
											} else if ($formTag) {
												// if (($formValue.siblings(".form-value").length > 0 || ($elm.attr("data-join") && $.trim($elm.attr("data-join")).length > 0)) && !$formValue.attr("data-join")) $formValue.siblings(".form-value").remove(); // check [11-2017 - tenshinoniwa]

												if (iValue && iValue.operand() !== null) {
													var iAlone = true;

													if ($formValue.find(":input").length > 1) {
														$formValue.find(":input").each(function() {
															var iN = $(this).attr("name");
															if (iN != arrs[i]) iAlone = false;
														});
													}

													var cVal = '<span class="confirm-value confirm-' + $formTag + ($formType ? "-" + $formType : "") + ' confirm-' + key.split(" ").join(" confirm-") + '">' + iValue + '</span>';

													$formInput.remove();

													if (iAlone === false) $formValue.append(cVal);
													else $formValue.html(cVal);
												} else if ($formRow.hasClass("form-remove-empty")) $formRow.remove();
												else if (__form__.keep !== false) $formValue.html('<span class="confirm-value confirm-' + $formTag + ($formType ? "-" + $formType : "") + ' confirm-empty">&#0182;</span>');
												else $formRow.remove();
											}
										}
									} else $formRow.remove(); // remove - missed :input
								}
							}

							// clean attributes
							$formRow
								.find(".form-value")
									.alterAttr("data-*")
								.end() // traverse back
								.alterAttr("data-*");
							$elm.alterAttr("data-*");
						});

						$formClone
							.alterAttr("data-*") // clean attributes
								.find(".attachment-remove")
									.remove()
									.end() // traverse back
								.find(".attachment-button")
									.remove();

						$formClone.addClass("display-" + __form__.display);

						$form.after($formClone.parent().html()); // adding cloned


						$("html, body").stop().animate({
							scrollTop: __form__.offset
						}, 300);

						if (__form__.display == "slide") { // slide
							$form.stop().slideUp(300, function() {
								$(this).removeAttr("style").hide();
							}).next(".fc-confirm").stop().slideDown(300, function() {
								$(this).removeAttr("style").show();
							});
						} else if (__form__.display == "fade") { // fade
							$form.stop().fadeOut(300, function() {
								$(this).removeAttr("style").hide();
							}).next(".fc-confirm").stop().delay(300).fadeIn(300, function() {
								$(this).removeAttr("style").show();
							});
						} else if (__form__.display == "show") { // show
							$form.stop().hide(0, function() {
								$(this).removeAttr("style").hide();
							}).next(".fc-confirm").stop().show(0, function() {
								$(this).removeAttr("style").show();
							});
						} else { // fixed
							$form.next(".fc-confirm").stop().fadeIn(300, function() {
								$(this).removeAttr("style").show();

								$("body").addClass("confirm-fixed");
							});
						}
					}

					console.log(FCMailer);
				}

				FCMailer.ascii();
			})
			.on("click", ".fc-form .form-back", function(e) { // form reset
				e.preventDefault();

				var $form = $(this).parents(".fc-form");
				$form.find("[class^='error']").hide();

				if ($(this).parents(".fc-form").first().is("form") || $(this).parents(".fc-form").first().find("form").length) $(this)[0].reset();  // reset the form - DOM
				else {
					// reset any form field
					$(this).parents(".fc-form").first().find(":input").each(function() {
						if ($(this).is(":file")) {
							var idx = $(this).parents(".fc-form").attr("data-index") !== undefined && $.trim($(this).parents(".fc-form").attr("data-index")).length > 0 ? $.trim($(this).parents(".fc-form").attr("data-index")).toLowerCase() : $(".fc-form").index($(this).parents(".fc-form")),
								aName = $(this).attr("name");

							if (aName) aName = aName.replace(/(\[.*\])*$/, "");

							if (FCMailer[idx] === undefined) FCMailer[idx] = {};
							if (FCMailer[idx].files === undefined) FCMailer[idx].files = {};

							FCMailer[idx].files[aName] = {}; // clear

							var $aForm = $(this).parents(".form-attachment").first();

							if ($aForm.hasClass("multiple")) {
								$aForm.find(".attachment-item").each(function() {
									$(this).find(".attachment-remove").click();
								});
							} else $aForm.find(".attachment-remove").click();

							$(this).replaceWith($(this).val("").clone(true, true));
						} else if ($(this).is(":radio, :checkbox")) $(this).prop("checked", this.defaultChecked);
						else if ($(this).is("select")) {
							$(this).find("option").each(function () {
								$(this).prop("selected", this.defaultSelected);
							});
						} else if (this.defaultValue) $(this).val(this.defaultValue);
						else $(this).val($(this).data("fc-remember"));
					});
				}

				$("html, body").stop().animate({
					scrollTop: $(this).parents(".fc-form").offset().top - ($(".fc-nav-fixed").length > 0 ? $(".fc-nav-fixed").outerHeight() : 0)
				}, 300);
			})
			.on("click", ".fc-confirm .form-submit", function(e) { // confirm submit
				e.preventDefault();

				console.clear();

				var $confirm = $(this).parents(".fc-confirm"),
					$form = $confirm.prev(".fc-form"),
					__form__ = {};

				__form__.idx = $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form);
				__form__.root = $form.attr("data-root") !== undefined && $.trim($form.attr("data-root")).length > 0 ? $.trim($form.attr("data-root")).toLowerCase() : false;
				__form__.email = $form.attr("data-email") !== undefined && $.trim($form.attr("data-email")).length > 0 ? $.trim($form.attr("data-email")).toLowerCase() : false;
				__form__.language = $form.attr("data-language") !== undefined && $.trim($form.attr("data-language")).length > 0 ? $.trim($form.attr("data-language")).toLowerCase() : false;
				__form__.multiple = $form.attr("data-multiple") !== undefined && $.trim($form.attr("data-multiple")).length > 0 ? $.trim($form.attr("data-multiple")).toLowerCase() : false;
				// __form__.debug = $form.attr("data-debug") !== undefined && FCMailer.debug == false ? $.trim($form.attr("data-debug")).operand() : false;
				__form__.debug = $form.attr("data-debug") !== undefined ? $.trim($form.attr("data-debug")).operand() : false;

				FCM.send($confirm, __form__);
			})
			.on("click", ".fc-confirm .form-back", function(e) { // confirm back
				var $confirm = $(this).parents(".fc-confirm").first(),
					$form = $confirm.prev(".fc-form").length > 0 ? $confirm.prev(".fc-form") : false,
					idx = $form && $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form);

				// reset
				if (FCMailer[idx] === undefined) FCMailer[idx] = {};
				FCMailer[idx].email = [];
				FCMailer[idx].serializes = [];

				$("html, body").stop().animate({
					scrollTop: $confirm.offset().top - ($(".fc-nav-fixed").length > 0 ? $(".fc-nav-fixed").outerHeight() : 0)
				}, 300);

				if ($form) {
					var formDisplay = ($form.attr("data-display") !== undefined && $.trim($form.attr("data-display")).length > 0 && $.inArray($.trim($form.attr("data-display")).toLowerCase(), ["slide", "fade", "show", "fixed"]) >= 0) ? $.trim($form.attr("data-display")).toLowerCase() : "fixed";

					if (formDisplay == "slide") { // slide
						$confirm.stop().slideUp(300, function() {
							$(this).remove();
						}).prev(".fc-form").stop().slideDown(300, function() {
							$(this).removeAttr("style").show();
						});
					} else if (formDisplay == "fade") { // fade
						$confirm.stop().fadeOut(300, function() {
							$(this).remove();
						}).prev(".fc-form").stop().delay(300).fadeIn(300, function() {
							$(this).removeAttr("style").show();
						});
					} else if (formDisplay == "show") { // show
						$confirm.stop().hide(0, function() {
							$(this).remove();
						}).prev(".fc-form").stop().show(0, function() {
							$(this).removeAttr("style").show();
						});
					} else { // fixed
						$confirm.stop().fadeOut(300, function() {
							$(this).remove();
							$("body").removeClass("confirm-fixed");
						}).prev(".fc-form").stop().fadeIn(300, function() {
							$(this).removeAttr("style").show();
						});
					}
				} else {
					$confirm.stop().fadeOut(300, function() {
						$(this).remove();
						$("body").removeClass("confirm-fixed");
					});
				}
			})
			.on("click", "#fc-debug .debug-close", function() {
				var $confirm = $(FCMailer.debug),
					$form = $confirm.prev(".fc-form"),
					idx = $form && $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form);

				if ($form) {
					if (FCMailer[idx] === undefined) FCMailer[idx] = {};

					FCMailer[idx].email = [];
				}

				FCMailer.debug = false;

				$("body").removeClass("debugger");

				$("#fc-debug").stop().fadeOut(300, function() {
					$(this).remove();

					$(".fc-loading").remove();
				});
			})
			.on("click", "#fc-debug .debug-tab .debug-link", function() { // switch tabs
				if (!$(this).hasClass("active")) {
					var idx = $(this).attr("data");

					$(this).siblings(".active").removeClass("active");
					$(this).addClass("active");

					$(this).parents(".debug-main").find(".debug-tab-target").stop().fadeOut(300, function() {
						$(this).removeAttr("style").removeClass("active");

						if ($(this).hasClass("debug-segment")) $(this).parents(".debug-content").removeClass("active");
						$("#fc-debug .debug-content").css({
							top: "100%"
						});
					});
					$(this).parents(".debug-main").find(".debug-tab-target[data='" + idx + "']").stop().delay(300).fadeIn(300, function() {
						var target = $(this);

						if (target.hasClass("debug-segment")) {
							target.parents(".debug-content").css({
								top: target.parents(".debug-content").siblings(".debug-head").outerHeight()
							}).addClass("active");

							setTimeout(function() {
								target.removeAttr("style").addClass("active");
							}, 50);
						} else target.removeAttr("style").addClass("active");
					});
				}
			})
			.on("click", "#fc-debug .debug-html .debug-switch", function() { // switch view - plain text to html
				$(this).parents(".debug-html").stop().fadeOut(300, function() {
					$(this).removeAttr("style").removeClass("active");

					$("#fc-debug .debug-content").css({
						top: "100%"
					});
				}).siblings(".debug-plain").stop().delay(300).fadeIn(300, function() {
					$(this).removeAttr("style").addClass("active");

					$("#fc-debug .debug-content").css({
						top: $("#fc-debug .debug-head").outerHeight()
					});
				});
			})
			.on("click", "#fc-debug .debug-plain .debug-switch", function() { // switch view - html to plain text
				$(this).parents(".debug-plain").stop().fadeOut(300, function() {
					$(this).removeAttr("style").removeClass("active");

					$("#fc-debug .debug-content").css({
						top: "100%"
					});
				}).siblings(".debug-html").stop().delay(300).fadeIn(300, function() {
					$(this).removeAttr("style").addClass("active");

					$("#fc-debug .debug-content").css({
						top: $("#fc-debug .debug-head").outerHeight()
					});
				});
			})
			.on("click", "#fc-debug .debug-button", function() { // send - debug submit
				if (FCMailer.debug === false) alert("ERROR");
				else $(FCMailer.debug).find(".form-submit").click();
			})
			.on("click", "#fc-debug .debug-config", function(e) { // debug - change email test
				e.stopPropagation();
			})
			.on("click", "#fc-debug .debug-change", function(e) { // debug - change email test
				e.stopPropagation();
				$(this).siblings(".debug-config").toggleClass("active");
			})
			.on("click", "#fc-debug .debug-config .d-config-button", function() { // debug - add email test
				var $blockAdd = $(this).siblings(".d-config-main").find(".d-config-add"),
					blockHTML = "";

				blockHTML += '<div class="d-config-block">';
					blockHTML += '<div class="d-config-remove">&times;</div>';
					blockHTML += '<div class="d-config-input"><input type="text" name="" value="" placeholder="Email address" /></div>';
				blockHTML += '</div>';

				if ($.trim($blockAdd.children(".d-config-block").first().find("input").val()).length < 1) $blockAdd.children(".d-config-block").first().find("input").focus();
				else {
					$blockAdd.prepend(blockHTML);
					$blockAdd.children(".d-config-block").first().find("input").focus();
				}
			})
			.on("click", "#fc-debug .debug-config .d-config-remove", function() { // debug - remove email test
				var $confirm = $(FCMailer.debug),
					$form = $confirm.prev(".fc-form"),
					idx = $form && $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form),
					$block = $(this).parents(".d-config-block").first();

				if (!$block.is(":last-child") && !$block.hasClass("d-config-removing")) { // remove
					$block.addClass("d-config-removing");
					$block.stop().slideUp(300, function() {
						var val = $.trim($block.find(".d-config-input input").val());

						if (FCMailer[idx] === undefined) FCMailer[idx] = {};
						if (FCMailer[idx].email === undefined) FCMailer[idx].email = [];

						arrayRemove(val, FCMailer[idx].email);

						$(this).remove();

						totalEmailDebug();
					});
				} else if ($block.is(":last-child") && $block.siblings(".d-config-block").length < 1) {
					arrayRemove($.trim($block.find("input").val()), FCMailer[idx].email);

					$block.find("input").val(""); // clear

					totalEmailDebug();
				}
			})
			.on("change", "#fc-debug .debug-config .d-config-select :input:checkbox", function() { // debug - email test
				var $confirm = $(FCMailer.debug),
					$form = $confirm.prev(".fc-form"),
					idx = $form && $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form),
					val = $.trim($(this).val());

				if ($(this).is(":checked")) {
					if (FCMailer[idx] === undefined) FCMailer[idx] = {};
					if (FCMailer[idx].email === undefined) FCMailer[idx].email = [];

					if ($.inArray(val, FCMailer[idx].email) < 0) FCMailer[idx].email.push(val);

					$(this).parents(".d-config-block").first().addClass("selected");
				} else {
					arrayRemove(val, FCMailer[idx].email);
					$(this).parents(".d-config-block").first().removeClass("selected");
				}

				totalEmailDebug();
			})
			.on("click", "#fc-messages-error .messages-close", function() { // close messages debug
				$(this).parents("#fc-messages-error").stop().fadeOut(300, function() {
					$(this).remove();

					if ($("#fc-debug").length < 1) $("body").removeClass("debugger");
				});
			})
			.on({
				change: function() {
					var $confirm = $(FCMailer.debug),
						$form = $confirm.prev(".fc-form"),
						idx = $form && $form.attr("data-index") !== undefined && $.trim($form.attr("data-index")).length > 0 ? $.trim($form.attr("data-index")).toLowerCase() : $(".fc-form").index($form),
						$iThis = $(this),
						val = $.trim($iThis.val());

					val = val.replace(/,/g, ";");

					if (FCMailer[idx] === undefined) FCMailer[idx] = {};
					if (FCMailer[idx].email === undefined) FCMailer[idx].email = [];

					if (/[;]/g.test(val)) {
						var emailArrs = val.split(";");

						for (var i in emailArrs) {
							var value = $.trim(emailArrs[i]);

							if (value.length > 0 && value.isEmail()) {
								if (i == 0) $iThis.val(value);
								else {
									$iThis.parents(".d-config-main").first().siblings(".d-config-button").click();
									$iThis.parents(".d-config-add").first().children(".d-config-block").first().find("input").val(value);
								}

								if ($.inArray(value, FCMailer[idx].email) < 0) FCMailer[idx].email.push(value);
							} else {
								if ($iThis.parents(".d-config-block").first().siblings(".d-config-block").length > 0) $iThis.parents(".d-config-input").first().siblings(".d-config-remove").click(); // remove
								else $iThis.val(""); // clear
							}
						}
					} else {
						if (val.length > 0) {
							if (val.isEmail()) {
								if ($.inArray(val, FCMailer[idx].email) < 0) FCMailer[idx].email.push(val);
							} else {
								if ($iThis.parents(".d-config-block").first().siblings(".d-config-block").length > 0) $iThis.parents(".d-config-input").first().siblings(".d-config-remove").click(); // remove
								else $iThis.val(""); // clear
							}
						} else {
							if ($iThis.parents(".d-config-block").first().siblings(".d-config-block").length > 0) {
								if ($iThis.parents(".d-config-block").first().is(":last-child")) $iThis.parents(".d-config-block").first().remove();
								else $iThis.parents(".d-config-input").first().siblings(".d-config-remove").click();
							}
						}
					}

					totalEmailDebug();
				},
				focus: function() {
					debugConfigBlur = false;
				},
				blur: function() {
					var $iThis = $(this);

					if (debugConfigBlur) $iThis.change();

					debugConfigBlur = true;
				},
				keydown: function(e) {
					var keyCode = e.keyCode ? e.keyCode : e.which,
						val = $.trim($(this).val());

					// enter key is pressed
					if (keyCode == 13 && val.length > 0) {
						val = val.replace(/,/g, ";");

						if (val.isEmail() || /[;]/g.test(val)) {
							if (/[;]/g.test(val)) $(this).change();

							$(this).parents(".d-config-main").first().siblings(".d-config-button").click(); // add
						} else $(this).val(""); // clear
					}
				}
			}, "#fc-debug .debug-config .d-config-input input");
	})
	.click(function() {
		debugConfigBlur = true;

		$("#fc-debug .debug-config.active").removeClass("active");

		// if ($(".form-parse-date > input, .form-parse-time > input, .form-parse-datetime > input").length > 0) $(".form-parse-date > input, .form-parse-time > input, .form-parse-datetime > input").datetimepicker("hide");
	});



$(window).resize(function() {
	if ($("#fc-debug").length > 0) {
		$("#fc-debug .debug-content").css({
			top: $("#fc-debug .debug-head").outerHeight()
		});
	}
});





var optionsDateTime = {
		// format: "Y/m/d H:i:s", // display

		mask: true,

		closeOnDateSelect: false,
		closeOnWithoutClick: false,
		timepickerScrollbar: false,
		defaultSelect: false,

		validateOnBlur: false,
		allowBlank: true,

		// theme: "dark",

		// callbacks
		onGenerate: function(current_time, $input, evt) {
			// $(this).find(".xdsoft_date.xdsoft_weekend").removeClass("xdsoft_disabled");
		},
		onShow: function(currentDateTime, $input, evt) {
		},
		onClose: function(current_time, $input, evt) {
			if (/_+\//.test($input.val()) || /_+:/.test($input.val())) $input.val("");
		},
		onSelectDate: function(current_time, $input, evt) {
		},
		onSelectTime: function(current_time, $input, evt) {
		},
		onChangeDateTime: function(current_time, $input, evt) {
		},
		onChangeMonth: function(current_time, $input) {
		},
		onChangeYear: function(current_time, $input) {
		},
		onGetWeekOfYear: function(datetime) {
		},
		beforeShowDay: function(date) {
		}
	},
	optionsDate = {
		datepicker: true,
		formatDate: "Y.m.d", // popup
		yearStart: 1950,
		yearEnd: 2050,
		minDate: false,
		maxDate: false,
		startDate: false,
		defaultDate: false,

		dayOfWeekStart: 1, // 0: Sunday, 1: Monday, 2: Tuesday,...
		disabledWeekDays: [],
		disabledDates: [],
		weekends: [],

		weeks: false,

		inline: false,

		timepicker: false
	},
	optionsTime = {
		timepicker: true,
		formatTime: "H:i", // popup
		defaultTime: false,
		// minTime: "08:00",
		// maxTime: "23:00",
		allowTimes: [],

		inline: false,

		datepicker: false
	};

function parseOptionsDate($parse, _getData) {
	var dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
		parseOpt = {},
		parseData = {
			name: $parse.attr("data-name") && $.trim($parse.attr("data-name")).length > 0 ? $.trim($parse.attr("data-name")).toLowerCase() : false, // string-key
			start: $parse.attr("data-date-start") && $.trim($parse.attr("data-date-start")).length > 0 ? $.trim($parse.attr("data-date-start")).toLowerCase() : "monday", // string day-name
			format: $parse.attr("data-date-format") && $.trim($parse.attr("data-date-format")).length > 0 ? $.trim($parse.attr("data-date-format")) : "Y/m/d", // string-date
			weeks: $parse.attr("data-date-weeks") && $.trim($parse.attr("data-date-weeks")).length > 0 ? $.trim($parse.attr("data-date-weeks")).operand() : false, // boolean
			dateMin: $parse.attr("data-date-min") && $.trim($parse.attr("data-date-min")).length > 0 ? $.trim($parse.attr("data-date-min")) : false, // string-date
			dateMax: $parse.attr("data-date-max") && $.trim($parse.attr("data-date-max")).length > 0 ? $.trim($parse.attr("data-date-max")) : false, // string-date
			dateActive: $parse.attr("data-date-active") && $.trim($parse.attr("data-date-active")).length > 0 ? $.trim($parse.attr("data-date-active")) : false, // string-date
			yearMin: $parse.attr("data-year-min") && $.trim($parse.attr("data-year-min")).length > 0 ? parseInt($parse.attr("data-year-min")) : false, // string-year
			yearMax: $parse.attr("data-year-max") && $.trim($parse.attr("data-year-max")).length > 0 ? parseInt($parse.attr("data-year-max")) : false, // string-year
			off: $parse.attr("data-date-off") && $.trim($parse.attr("data-date-off")).length > 0 ? $.trim($parse.attr("data-date-off")) : false, // number-index
			closed: $parse.attr("data-date-closed") && $.trim($parse.attr("data-date-closed")).length > 0 ? $.trim($parse.attr("data-date-closed")) : false, // string-date
			opened: $parse.attr("data-date-opened") && $.trim($parse.attr("data-date-opened")).length > 0 ? $.trim($parse.attr("data-date-opened")) : false, // string-date
			require: $parse.attr("data-require") && $.trim($parse.attr("data-require")).length > 0 ? $.trim($parse.attr("data-require")).operand() : false, // boolean
			inline: $parse.attr("data-inline") && $.trim($parse.attr("data-inline")).length > 0 ? $.trim($parse.attr("data-inline")).operand() : false // boolean
		},
		__date__ = new Date(),
		__year__ = __date__.getFullYear(),
		__month__ = Number(__date__.getMonth()) + 1,
		__day__ = __date__.getDate();

	if (_getData === true) return parseData;

	if (!parseData.name) FCM.dataParseMissing("data-name", "form-parse-date");
	else {
		$.extend(true, parseOpt, optionsDateTime);
		$.extend(true, parseOpt, optionsDate);

		if (parseData.start && $.inArray(parseData.start, dayOfWeek) >= 0) parseOpt.dayOfWeekStart = $.inArray(parseData.start, dayOfWeek);
		else parseOpt.dayOfWeekStart = 1; // monday

		var __check__ = parseData.format ? FCParseDate(".fc-form-date").format(parseData.format) : false;

		if (__check__ === false) parseData.format = "Y/m/d";
		parseOpt.format = parseData.format;
		parseOpt.formatDate = parseData.format;

		if (__check__ !== false && parseData.dateActive && /^today/i.test($.trim(parseData.dateActive).toLowerCase())) parseData.dateActive = parseOptionsToday(parseData.dateActive, __check__._separate_); // today
		if (__check__ !== false && __check__.valid(parseData.dateActive)) {
			parseOpt.value = parseData.dateActive;
		} else {
			parseOpt.value = null;
		}

		if (parseData.yearMin) parseOpt.yearStart = parseData.yearMin;
		if (parseData.yearMax) parseOpt.yearEnd = parseData.yearMax;

		if (__check__ !== false && parseData.dateMin && /^today/i.test($.trim(parseData.dateMin).toLowerCase())) parseData.dateMin = parseOptionsToday(parseData.dateMin, __check__._separate_); // today
		if (__check__ !== false && __check__.valid(parseData.dateMin)) {
			parseOpt.minDate = parseData.dateMin;
			parseOpt.yearStart = __check__.getYear(parseData.dateMin);
		} else {
			parseOpt.minDate = false;
			if (!parseData.yearMin) parseOpt.yearStart = optionsDate.yearStart;
		}

		if (__check__ !== false && parseData.dateMax && /^today/i.test($.trim(parseData.dateMax).toLowerCase())) parseData.dateMax = parseOptionsToday(parseData.dateMax, __check__._separate_); // today
		if (__check__ !== false && __check__.valid(parseData.dateMax)) {
			parseOpt.maxDate = parseData.dateMax;
			parseOpt.yearEnd = __check__.getYear(parseData.dateMax);
		} else {
			parseOpt.maxDate = false;
			if (!parseData.yearMax) parseOpt.yearEnd = optionsDate.yearEnd;
		}

		// default date
		if (parseData.dateActive) parseOpt.startDate = parseData.dateActive;
		else if (parseOpt.minDate) parseOpt.startDate = parseOpt.minDate;
		else if (parseOpt.maxDate) parseOpt.startDate = parseOpt.maxDate;

		/*
		if (parseOpt.minDate && parseOpt.maxDate == false) {
			var max = __check__._format_;

			parseOpt.maxDate = max
				.replace(/Y+/, parseOpt.yearEnd ? parseOpt.yearEnd : optionsDate.yearEnd)
				.replace(/m+/, 12)
				.replace(/d+/, "01");
		}
		*/

		var off = [];
		if (parseData.off) {
			var arr = parseData.off.split(" ");

			for (var i in arr) {
				if ($.inArray(arr[i], dayOfWeek) >= 0) off.push($.inArray(arr[i], dayOfWeek));
			}
		} else {
		}
		parseOpt.disabledWeekDays = off;

		var closed = [];
		if (parseData.closed) {
			var arr = parseData.closed.split(" ");

			for (var i in arr) {
				if (__check__ !== false && __check__.valid(arr[i])) closed.push(arr[i]);
			}
		} else {
		}
		parseOpt.disabledDates = closed;

		var opened = [];
		if (parseData.opened) {
			var arr = parseData.opened.split(" ");
			for (var i in arr) {
				if (__check__ !== false && __check__.valid(arr[i])) opened.push(arr[i]);
			}

			var _onGenerate = [];
			for (var i in opened) {
				var _parse = FCParseDate(".fc-form-date").format(__check__._format_),
					_valid = _parse.valid(opened[i]),
					_date = _parse._data_;

				if (_valid) _onGenerate.push('.xdsoft_date[data-date="' + _date.d + '"][data-month="' + (_date.m - 1) + '"][data-year="' + _date.y + '"]');
			}

			if (_onGenerate.length > 0) {
				parseOpt.onGenerate = function() {
					for (var i in _onGenerate) {
						if ($(_onGenerate[i]).length > 0) $(_onGenerate[i]).removeClass("xdsoft_disabled");
					}
				}
			}
		} else {
		}
		parseOpt.weekends = opened;

		parseOpt.weeks = parseData.weeks;
		parseOpt.inline = parseData.inline;

		return parseOpt;
	}

	return false;
}
function parseOptionsTime($parse, _getData) {
	var dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
		arrStep = [15, 30, 60],
		parseOpt = {},
		parseData = {
			name: $parse.attr("data-name") && $.trim($parse.attr("data-name")).length > 0 ? $.trim($parse.attr("data-name")).toLowerCase() : false, // string-key
			timeRange: $parse.attr("data-time-range") && $.trim($parse.attr("data-time-range")).length > 0 ? $.trim($parse.attr("data-time-range")) : false, // string-time
			timeMin: $parse.attr("data-time-min") && $.trim($parse.attr("data-time-min")).length > 0 ? $.trim($parse.attr("data-time-min")) : false, // string-time
			timeMax: $parse.attr("data-time-max") && $.trim($parse.attr("data-time-max")).length > 0 ? $.trim($parse.attr("data-time-max")) : false, // string-time
			timeActive: $parse.attr("data-time-active") && $.trim($parse.attr("data-time-active")).length > 0 ? $.trim($parse.attr("data-time-active")) : false, // string-time
			step: $parse.attr("data-time-step") && $.trim($parse.attr("data-time-step")).length > 0 ? Number($parse.attr("data-time-step")) : false, // number-time
			require: $parse.attr("data-require") && $.trim($parse.attr("data-require")).length > 0 ? $.trim($parse.attr("data-require")).operand() : false, // boolean
			inline: $parse.attr("data-inline") && $.trim($parse.attr("data-inline")).length > 0 ? $.trim($parse.attr("data-inline")).operand() : false // boolean
		},
		__date__ = new Date(),
		__hour__ = __date__.getHours(),
		__minute__ = __date__.getMinutes();

	if (_getData === true) return parseData;

	if (!parseData.name) FCM.dataParseMissing("data-name", "form-parse-time");
	else {
		$.extend(true, parseOpt, optionsDateTime);
		$.extend(true, parseOpt, optionsTime);

		var _format_ = "H:i";

		var __check__ = FCParseTime(".fc-form-time").format(_format_);

		parseOpt.format = _format_;
		parseOpt.formatTime = _format_;

		if (__check__ !== false && __check__.valid(parseData.timeActive)) {
			parseOpt.value = parseData.timeActive;
		} else {
			parseOpt.value = null;
		}

		var rangeStep = 60,
			rangeMin = "00:00",
			rangeMax = "23:00";

		if (parseData.step && $.inArray(parseData.step, arrStep) >= 0) rangeStep = Number(parseData.step);

		if (__check__ !== false && __check__.valid(parseData.timeMin)) rangeMin = parseData.timeMin;

		if (__check__ !== false && __check__.valid(parseData.timeMax)) rangeMax = parseData.timeMax;
		else {
			if (rangeStep == 15) rangeMax = "23:45";
			else if (rangeStep == 30) rangeMax = "23:30";
		}

		if (__check__) {
			var timeMin = __check__.getTime(rangeMin),
				timeMax = __check__.getTime(rangeMax),
				todayMin = new Date(),
				todayMax = new Date(),
				listTime = [];

			if (timeMin.hour > timeMax.hour || (timeMin.hour == timeMax.hour && timeMin.minute == timeMax.minute)) todayMax.setDate(todayMax.getDate() + 1); // tomorrow
			else if (timeMin.hour == timeMax.hour && timeMin.minute > timeMax.minute) { // default
				timeMin = __check__.getTime("00:00");

				if (rangeStep == 15) timeMax = __check__.getTime("23:45");
				else if (rangeStep == 30) timeMax = __check__.getTime("23:30");
				else timeMax = __check__.getTime("23:00");
			}

			todayMin.setHours(timeMin.hour);
			todayMin.setMinutes(timeMin.minute);
			todayMin.setSeconds(0);

			todayMax.setHours(timeMax.hour);
			todayMax.setMinutes(timeMax.minute);
			todayMax.setSeconds(0);

			listTime.push(rangeMin);
			for (var i = todayMin.getTime(); i <= todayMax.getTime(); i++) {
				todayMin.setMinutes(todayMin.getMinutes() + rangeStep);

				if (todayMin.getTime() >= todayMax.getTime()) break;

				var str = "";
				str += todayMin.getHours().zeroPad(2);
				str += ":";
				str += todayMin.getMinutes().zeroPad(2);

				listTime.push(str);
			}
			listTime.push(rangeMax);

			parseOpt.allowTimes = listTime;
		}

		parseOpt.inline = parseData.inline;

		return parseOpt;
	}

	return false;
}
function parseOptionsToday(str, separate) {
	var arr = str.match(/^today\s*([+|-]?)\s*(\d+)\s*([d|m|y]?)*/i),
		today = new Date(),
		dateStr = "";

	if (arr && arr.length > 3) {
		if (arr[3] && arr[3].toLowerCase() == "m") {
			if (arr[1] == "-") today.setMonth(today.getMonth() - Number(arr[2]));
			else today.setMonth(today.getMonth() + Number(arr[2]));
		} else if (arr[3] && arr[3].toLowerCase() == "y") {
			if (arr[1] == "-") today.setFullYear(today.getFullYear() - Number(arr[2]));
			else today.setFullYear(today.getFullYear() + Number(arr[2]));
		} else {
			if (arr[1] == "-") today.setDate(today.getDate() - Number(arr[2]));
			else today.setDate(today.getDate() + Number(arr[2]));
		}
	}

	dateStr += today.getFullYear();
	dateStr += separate;
	dateStr += today.getMonth() + 1;
	dateStr += separate;
	dateStr += today.getDate();

	return dateStr;
}

function totalEmailDebug() {
	var debugEmailTotal = 0;
	$("#fc-debug .debug-config .d-config-block").each(function() {
		if ($(this).children(".d-config-select").length > 0) {
			if ($(this).children(".d-config-select").find(":input:checkbox").is(":checked")) debugEmailTotal++;
		} else {
			var val = $.trim($(this).find("input").val());

			if (val.length > 0 && val.isEmail()) debugEmailTotal++;
		}
	});

	$("#fc-debug .debug-change").attr("data", debugEmailTotal); // update total
}
function arrayRemove(value, array) {
	var idx = $.inArray(value, array);

	if (idx >= 0) array.splice(idx, 1);

	return array;
}


// validate
var FCV = function() {
};
FCV.prototype = {
	monthDays: function(year, month) {
		return (new Date(Number(year), Number(month), 0)).getDate();
	}
};
var FCV = new FCV();

var FCM = function() {
};
FCM.prototype = {
	errorMissing: function(name, type) {
		console.warn("%c:input[name=\"%s\"] %c> %c%s %cis missing", "color: green", name, "color: purple; font-size: medium", "color: red", "." + type, ""); // .error is missing
	},
	rowMissing: function(name) {
		console.warn("%c:input[name=\"%s\"] %c> %c.form-row %celement not found", "color: green", name, "color: purple; font-size: medium", "color: red", ""); // .form-row element not found
	},
	inputMissing: function(name) {
		console.warn("%c[data-for=\"%s\"] %c> %c:input[name=\"%s\"] %cis missing", "color: green", name, "color: purple; font-size: medium", "color: red", name, ""); // [data-for] > input[name] is missing
	},
	matchMissing: function(name) {
		console.warn("%c[data-match=\"%s\"] %c> %c:input[name=\"%s\"] %cis missing", "color: green", name, "color: purple; font-size: medium", "color: red", name, ""); // [data-match] > input[name] is missing
	},
	dataParseMissing: function(name, elm) {
		console.warn("%c.%s %c> %c[%s] %cis missing", "color: green", elm, "color: purple; font-size: medium", "color: red", name, ""); // .form-parse > [data-*] is missing
	},
	dataParseInvalid: function(name, elm) {
		console.warn("%c.%s %c> %c[%s] %cis invalid", "color: green", elm, "color: purple; font-size: medium", "color: red", name, ""); // .form-parse > [data-*] is invalid
	},
	send: function(elm, cfg) {
		var path = "mailform/",
			formData = new FormData();

		if (FCMailer.debug) cfg.debug = false; // debug - send

		formData.append("module", "FCMailer");
		formData.append("email", cfg.email);
		formData.append("language", cfg.language);
		formData.append("multiple", cfg.multiple);
		formData.append("debug", cfg.debug);
		formData.append("data", JSON.stringify(FCMailer[cfg.idx].serializes));
		formData.append("email-test", JSON.stringify(FCMailer[cfg.idx].email));

		if (FCMailer[cfg.idx].files && Object.keys(FCMailer[cfg.idx].files).length > 0) {
			for (var i in FCMailer[cfg.idx].files) {
				var iFile = FCMailer[cfg.idx].files[i];

				for (var j in iFile) {
					formData.append("files-" + j, iFile[j]);
				}
			}
		}

		// if (cfg.root) path = cfg.root + path;

		$.ajax({
			url: path,
			type: "POST",
			dataType: "JSON",
			contentType: false,
			processData: false,
			data: formData,
			beforeSend: function() {
				if ($(".fc-loading").length < 1) $("body").append('<div class="fc-loading" />');

				$(".fc-loading").addClass("active");

				elm.find("button").prop("disabled", true);
			},
			success: function(json) {
				if (json.status == "success") {
					if (FCMailer[cfg.idx] === undefined) FCMailer[cfg.idx] = {};
					if (FCMailer[cfg.idx].email === undefined) FCMailer[cfg.idx].email = [];

					if (json.debug !== undefined && json.debug == true) {
						var debugHTML = "";

						debugHTML += '<div id="fc-debug">';
							debugHTML += '<div class="debug-main">';
								debugHTML += '<div class="debug-head">';
									if (json["customer"] !== undefined && Object.keys(json["customer"]).length > 0) {
										debugHTML += '<div class="debug-menu">';
											debugHTML += '<div class="debug-close">&times;</div>';
											debugHTML += '<div class="debug-tab">';
												debugHTML += '<div class="debug-button">Send</div>';
												debugHTML += '<div class="debug-link active" data="owner">Owner</div>';
												debugHTML += '<div class="debug-link" data="customer">Customer</div>';
											debugHTML += '</div>';
										if (json.local) debugHTML += '<div class="debug-local">Local: <span>' + json.local + '</span></div>';
										debugHTML += '</div>';
									} else debugHTML += '<div class="debug-close">&times;</div>';

									// URL redirect
									if ((json.url !== undefined && json.url.length > 0) || (json["config-loaded"] !== undefined && json["config-loaded"].length > 0)) {
										debugHTML += '<div class="debug-url">';
											if (json.url !== undefined && json.url.length > 0) debugHTML += '<a href="' + json.url + '" target="_blank">' + json.url + '</a>';
											if (json["config-loaded"] !== undefined && json["config-loaded"].length > 0) {
												debugHTML += '<div class="debug-path-config">';
													if (json["config-missing"] !== undefined && json["config-missing"].length > 0) debugHTML += '<small class="debug-path-missing">' + json["config-missing"] + '</small>';
													debugHTML += '<small class="debug-path-loaded">' + json["config-loaded"] + '</small>';
												debugHTML += '</div>';
											}
										debugHTML += '</div>';
									}

									// headers - owner
									debugHTML += '<div class="debug-mail debug-tab-target active" data="owner">';

										if (json.local) {
											debugHTML += '<div class="debug-change" data="' + (json["email-test"] !== false && json["email-test"].length > 0 ? json["email-test"].length : 0) + '">Config</div>';
											debugHTML += '<div class="debug-config">';
												debugHTML += '<div class="d-config-button">Add Email</div>';
												debugHTML += '<div class="d-config-main">';
													debugHTML += '<div class="d-config-add">';
														debugHTML += '<div class="d-config-block">';
															debugHTML += '<div class="d-config-remove">&times;</div>';
															debugHTML += '<div class="d-config-input"><input type="text" name="" value="" placeholder="Email address" /></div>';
														debugHTML += '</div>';
													debugHTML += '</div>';

													if (json["email-test"] !== false && json["email-test"].length > 0) {
														debugHTML += '<hr />';

														for (var x in json["email-test"]) {
															if ($.inArray(json["email-test"][x], FCMailer[cfg.idx].email) < 0) FCMailer[cfg.idx].email.push(json["email-test"][x]);

															debugHTML += '<div class="d-config-block selected">';
																debugHTML += '<div class="d-config-select">';
																	debugHTML += '<label>';
																		debugHTML += '<input type="checkbox" name="email-select" value="' + json["email-test"][x] + '" checked="checked" />';
																		debugHTML += '<span></span>';
																	debugHTML += '</label>';
																debugHTML += '</div>';
																debugHTML += '<div class="d-config-input">' + json["email-test"][x] + '</div>';
															debugHTML += '</div>';
														}
													}
												debugHTML += '</div>';
											debugHTML += '</div>';
										}

										$.each(json["owner"].headers, function(idx, val) {
											debugHTML += '<div class="debug-block">';
												debugHTML += '<div class="debug-caption">' + idx + ':</div>'; // caption
												idx = $.trim(idx).toLowerCase();
												var headerVal = "";
												if (idx == "content-type") headerVal = "<mark>" + val + "</mark>";
												else if (idx == "from") {
													if (val[1].length > 0) headerVal = '<b>' + val[1] + '</b> <em>&lt;' + val[0] + '&gt;</em>';
													else headerVal = val[0];
												} else {
													var headerArr = [];
													for (var i in val) {
														var emailStr = val[i][0];
														if (val[i][1].length > 0) emailStr = '<b>' + val[i][1] + '</b> <em>&lt;' + val[i][0] + '&gt;</em>';

														if (json.local && json["email-test"] !== false && json["email-test"].length > 0 && (idx == "to" || idx == "cc" || idx == "bcc")) emailStr = '<s>' + emailStr + '</s>';

														headerArr.push(emailStr);
													}
													headerVal = headerArr.join(",<br />");

													// if (idx == "to" && json["email-test"] !== false && json["email-test"].length > 0) {
														// headerVal += '<div class="email-test">';
															// headerVal += json["email-test"].join(",<br />");
														// headerVal += '</div>';
													// }
												}
												debugHTML += '<div class="debug-value">' + headerVal + '</div>';
											debugHTML += '</div>';
										});

									debugHTML += '</div>';

									// headers - customer
									if (json["customer"] !== undefined && Object.keys(json["customer"]).length > 0) {
										debugHTML += '<div class="debug-mail debug-tab-target" data="customer">';

											$.each(json["customer"].headers, function(idx, val) {
												debugHTML += '<div class="debug-block">';
													debugHTML += '<div class="debug-caption">' + idx + ':</div>'; // caption
													idx = $.trim(idx).toLowerCase();
													var headerVal = "";
													if (idx == "content-type") headerVal = "<mark>" + val + "</mark>";
													else if (idx == "from") {
														if (val[1].length > 0) headerVal = '<b>' + val[1] + '</b> <em>&lt;' + val[0] + '&gt;</em>';
														else headerVal = val[0];
													} else {
														var headerArr = [];
														for (var i in val) {
															var emailStr = val[i][0];
															if (val[i][1].length > 0) emailStr = '<b>' + val[i][1] + '</b> <em>&lt;' + val[i][0] + '&gt;</em>';

															// if (json.local && json["email-test"] !== false && json["email-test"].length > 0 && (idx == "to" || idx == "cc" || idx == "bcc")) emailStr = '<s>' + emailStr + '</s>';

															headerArr.push(emailStr);
														}
														headerVal = headerArr.join(",<br />");

														// if (idx == "to" && json["email-test"].length > 0) {
															// headerVal += '<div class="email-test">';
																// headerVal += json["email-test"].join(",<br />");
															// headerVal += '</div>';
														// }
													}
													debugHTML += '<div class="debug-value">' + headerVal + '</div>';
												debugHTML += '</div>';
											});

										debugHTML += '</div>';
									}

									// subject - owner
									debugHTML += '<div class="debug-subject debug-tab-target active" data="owner">' + json["owner"].subject + '</div>';

									// subject - customer
									if (json["customer"] !== undefined && Object.keys(json["customer"]).length > 0) debugHTML += '<div class="debug-subject debug-tab-target" data="customer">' + json["customer"].subject + '</div>';
								debugHTML += '</div>';

								if (json.attachment.length > 0) {
									debugHTML += '<div class="debug-attachment">';
										for (var a in json.attachment) {
											debugHTML += '<div class="debug-attach-item" data="' + json.attachment[a].type + '">' + (json.attachment[a].content ? '<img src="' + json.attachment[a].content + '" alt="' + escape(json.attachment[a].name) + '" />' : "") + '</div>';
										}
									debugHTML += '</div>';
								}

								debugHTML += '<div class="debug-content active">';
									// content - owner
									debugHTML += '<div class="debug-segment' + (" " + (json["owner"].available ? "available" : "unavailable")) + ' debug-tab-target active" data="owner">';
										debugHTML += '<div class="debug-html' + (json["owner"].isHTML === false ? "" : " active") + '">';
											debugHTML += '<div class="debug-switch">Plain text</div>';
											debugHTML += '<iframe></iframe>';
										debugHTML += '</div>';
										debugHTML += '<div class="debug-plain' + (json["owner"].isHTML === false ? " active" : "") + '">';
											debugHTML += '<div class="debug-switch">HTML</div>';
											debugHTML += '<pre>' + json["owner"].plain + '</pre>';
										debugHTML += '</div>';
									debugHTML += '</div>';

									// content - customer
									if (json["customer"] !== undefined && Object.keys(json["customer"]).length > 0) {
										debugHTML += '<div class="debug-segment' + (" " + (json["customer"].available ? "available" : "unavailable")) + ' debug-tab-target" data="customer">';
											debugHTML += '<div class="debug-html' + (json["customer"].isHTML === false ? "" : " active") + '">';
												debugHTML += '<div class="debug-switch">Plain text</div>';
												debugHTML += '<iframe></iframe>';
											debugHTML += '</div>';
											debugHTML += '<div class="debug-plain' + (json["customer"].isHTML === false ? " active" : "") + '">';
												debugHTML += '<div class="debug-switch">HTML</div>';
												debugHTML += '<pre>' + json["customer"].plain + '</pre>';
											debugHTML += '</div>';
										debugHTML += '</div>';
									}
								debugHTML += '</div>';

							debugHTML += '</div>';
						debugHTML += '</div>';


						if ($("#fc-debug").length > 0) $("#fc-debug").remove();
						$("body")
							.removeClass("debugger")
							.append(debugHTML);

						$("#fc-debug").find(".debug-segment[data='owner'] iframe").contents().find("html").html(json["owner"].html); // push html - owner

						if (json["customer"] !== undefined && Object.keys(json["customer"]).length > 0) $("#fc-debug").find(".debug-segment[data='customer'] iframe").contents().find("html").html(json["customer"].html); // push html - customer

						$("#fc-debug .debug-content").css({
							top: $("#fc-debug .debug-head").outerHeight()
						});

						$("body").addClass("debugger");

						FCMailer.debug = elm;
					} else {
						alert(json.messages);

						var url = (json.url === undefined || json.url === false || json.url.length < 1) ? "index.html" : json.url;
						if (url.substr(0, 1) === "#") {
							var $target = $(url);
							$target = $target.length > 0 ? $target : $("[name='" + url.slice(1) + "']");
							if ($target.length > 0) {
								if ($target.is(":hidden") && elm.parents(".submit-hide-form").length > 0) {
									elm.parents(".submit-hide-form").stop().fadeOut(300, function() {
										$(this).removeAttr("style").hide();
									});
								} else location.href = url;

								$(".submit-hide-form").hide();

								elm.stop().fadeOut(300, function() {
									$(this).remove();
								});

								$target.stop().delay(300).fadeIn(300, function() {
									$(this).removeAttr("style").show();

									$("html, body").animate({
										scrollTop: $target.offset().top
									}, 500);
								});
							} else location.href = url;
						} else location.href = url;
					}
				} else {
					alert(json.messages);

					if (json.error !== undefined && json.error.length > 0) {
						var debugMsg = "";

						debugMsg += '<div id="fc-messages-error">';
							debugMsg += '<div class="messages-main">';
								if (json.SMTPDebug !== undefined && json.SMTPDebug.length > 0) {
									debugMsg += '<div class="messages-title">' + json.error + '</div>';
									debugMsg += '<pre>' + json.SMTPDebug + '</pre>';
								} else debugMsg += '<pre>' + json.error + '</pre>';
							debugMsg += '</div>';
							debugMsg += '<div class="messages-close">Got it</div>';
						debugMsg += '</div>';

						if ($("#fc-messages-error").length > 0) $("#fc-messages-error").remove();

						$("body")
							.addClass("debugger")
							.append(debugMsg);
					}
				}

				elm.find("button").prop("disabled", false);

				$(".fc-loading").removeClass("active");

				FCMailer.ascii();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				var msg = false;

				if (jqXHR.status === 0) msg = "Not connect.\nVerify Network.";
				else if (jqXHR.status == 400) msg = "[400] Server understood the request, but request content was invalid.";
				else if (jqXHR.status == 401) msg = "[401] Unauthorized access.";
				else if (jqXHR.status == 403) msg = "[403] Forbidden resource can't be accessed.";
				else if (jqXHR.status == 404) msg = "[404] Requested page not found.";
				else if (jqXHR.status == 500) msg = "[500] Internal server error.";
				else if (jqXHR.status == 503) msg = "[503] Service unavailable.";
				else if (textStatus === "parsererror") msg = "Requested JSON parse failed.";
				else if (textStatus === "timeout") msg = "Request Time out.";
				else if (textStatus === "abort") msg = "Request was aborted by the server.";
				else msg = "Uncaught Error.";

				console.error(msg);
				console.warn("[jqXHR]", jqXHR);
				console.warn("[" + textStatus + "]", errorThrown);
				console.log("%c%s", "color: #303030; font-family: monospace; background-color: #F9F9F9;", jqXHR.responseText);

				if (cfg.debug) {
					var debugMsg = "",
						debugTitle = msg,
						debugContent = jqXHR.responseText;

					debugTitle += '<br />';
					debugTitle += errorThrown;

					debugContent = 
						debugContent
						.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;")
						.replace(/"/g, "&quot;")
						.replace(/'/g, "&#039;");

					debugMsg += '<div id="fc-messages-error">';
						debugMsg += '<div class="messages-main">';
							debugMsg += '<div class="messages-title">' + debugTitle + '</div>';
							debugMsg += '<pre>' + debugContent + '</pre>';
						debugMsg += '</div>';
						debugMsg += '<div class="messages-close">Got it</div>';
					debugMsg += '</div>';

					if ($("#fc-messages-error").length > 0) $("#fc-messages-error").remove();

					$("body").addClass("debugger").append(debugMsg);

					elm.find("button").prop("disabled", false);

					$(".fc-loading").removeClass("active");
				}
			}
		});

		// console.log("FCMailer");
		// for (var i in FCMailer) {
			// console.group(i);
				// console.table(FCMailer[i].serializes);
			// console.groupEnd();
		// }

		// console.table(cfg);
	}
};
var FCM = new FCM();





/*
 * OOPs
 *
 */

var __FCParseDate__ = function(elm) {
	this._element_ = elm;
	this._data_ = {};
	this._format_ = false;
	this._separate_ = false;
	this._regex_ = /(^(19|[2-9][0-9])\d\d|(((0?[1-9]|1[012])[\/|\-|\.| ](0?[1-9]{1,2}|[12][0-8]))|((0?[13578]|1[02])[\/|\-|\.| ](29|30|31))|((0?[4,6,9]|11)[\/|\-|\.| ](29|30)))$)|(^(19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)[\/|\-|\.| ]0?2[\/|\-|\.| ]29$)/; // Y/m/d
};
__FCParseDate__.prototype = {
	format: function(str) {
		str = $.trim(str);

		var separate = str.match(/[\.|\/|\-| ]/g);

		if (str.length != 5 || /[^\.|\/|\-| |Y|m|d]/ig.test(str)) {
			console.warn("%c%s %c> %cformat %c%s %cis invalid", "color: green;", this._element_, "color: purple; font-size: medium", "", "color: red", str, ""); // ex: Y/m/d
			return false;
		} else if (separate === null || separate.length !== 2 || separate[0] !== separate[1]) {
			console.warn("%c%s %c> %c%s %cseparate is heterogeneous", "color: green;", this._element_, "color: purple; font-size: medium", "color: red", str, "");
			return false;
		} else {
			this._format_ = str;
			this._separate_ = separate[0];
		}

		return this;
	},
	valid: function(str) {
		if (this._format_ && str) {
			var ptn = this._format_.replace(/Y/ig, "(\\FC{4})").replace(/m/ig, "(\\FC{1,2})").replace(/d/ig, "(\\FC{1,2})").replace(/FC/ig, "d"),
				regex = new RegExp(ptn),
				arrSeparate = this._format_.split(this._separate_),
				arrDate = str.match(regex),
				_check_ = "",
				_date_ = new Date(),
				_year_ = _date_.getFullYear(),
				_month_ = Number(_date_.getMonth()) + 1,
				_day_ = _date_.getDate();

			if (arrDate === null || arrDate.length < 4) return false;

			for (var i in arrSeparate) {
				i = Number(i);

				var key = arrSeparate[i].toLowerCase(),
					val = arrDate[i + 1];

				if (val.length < 1) return false;

				this._data_[key] = Number(val);
			}

			if (this._data_.y === undefined || this._data_.m === undefined || this._data_.d === undefined) return false;
			else {
				_check_ += this._data_.y;
				_check_ += this._separate_;
				_check_ += this._data_.m;
				_check_ += this._separate_;
				_check_ += this._data_.d;

				if (this._regex_.test(_check_)) return true;
				else return false;
			}

		} else return false;
	},
	getYear: function(str) {
		if (this.valid(str)) return this._data_.y;
		else return false;
	},
	getMonth: function(str) {
		if (this.valid(str)) return this._data_.m;
		else return false;
	},
	getDay: function(str) {
		if (this.valid(str)) return this._data_.d;
		else return false;
	}
};
function FCParseDate(elm) {
	return new __FCParseDate__(elm);
}

var __FCParseTime__ = function(elm) {
	this._element_ = elm;
	this._format_ = false;
	this._separate_ = false;
	this._regex_ = /(^(0?[0-9]|1[0-2]):[0-5][0-9](:[0-5][0-9])?\s*[ap]m$)|(^([0-2]?[0-3]|[01]?[0-9])[:][0-5][0-9]([:][0-5][0-9])?$)/i; // H:i:s A
};
__FCParseTime__.prototype = {
	format: function(str) {
		str = $.trim(str);

		var separate = str.match(/[\:]+/g);

		if (str.length < 3 || str.length > 7 || /[^\:| |H|i|s|A|P]/ig.test(str)) console.warn("%c%s %c> %cformat %c%s %cis invalid", "color: green;", this._element_, "color: purple; font-size: medium", "", "color: red", str, ""); // ex: H:i:s A
		else if (separate === null || separate.length > 2 || (separate[1] && separate[0] !== separate[1])) console.warn("%c%s %c> %c%s %cseparate is heterogeneous", "color: green;", this._element_, "color: purple; font-size: medium", "color: red", str, "");
		else {
			this._format_ = str;
			this._separate_ = separate[0];
		}

		return this;
	},
	valid: function(str) {
		if (this._format_ && str) {
			if (this._regex_.test(str)) return true;
			else return false;

		} else return false;
	},
	getTime: function(str) {
		if (this.valid(str)) {
			if (/^(0?[0-9]|1[0-2]):[0-5][0-9](:[0-5][0-9])?\s*[ap]m$$/i.test(str)) { // H:i:s A
				var pm = /\s*[ap]m$/i.test(str),
					time = str.replace(/\s*[ap]m$/i, ""),
					arr = time.split(":"),
					hour = arr[0] ? Number(arr[0]) : null,
					minute = arr[1] ? Number(arr[1]) : null,
					second = arr[2] ? Number(arr[2]) : null;

				if (pm && hour < 12) hour += 12;
				if (!pm && hour == 12) hour -= 12;

				return {
					hour: hour,
					minute: minute,
					second: second
				};
			} else {
				var arr = str.split(":");

				return {
					hour: arr[0] ? Number(arr[0]) : null,
					minute: arr[1] ? Number(arr[1]) : null,
					second: arr[2] ? Number(arr[2]) : null
				};
			}
		} else return false;
	}
};
function FCParseTime(elm) {
	return new __FCParseTime__(elm);
}




/*
 * Plugins
 *
 */

(function($) {
	$.fn.alterClass = function(removals, additions) {
		var self = this;
		if (removals.indexOf("*") === -1) { // use native jQuery methods if there is no wildcard matching
			self.removeClass(removals);
			return !additions ? self : self.addClass(additions);
		}

		var ptn = new RegExp("\\s" + removals.replace(/\*+/g, "[A-Za-z0-9-_]+").split(" ").join("\\s|\\s") + "\\s", "g");
		self.each(function(i, it) {
			var clss = " " + it.className + " ";
			while (ptn.test(clss)) {
				clss = clss.replace(ptn, " ");
			}
			it.className = $.trim(clss);
		});
		return !additions ? self : self.addClass(additions);
	};
	$.fn.alterAttr = function(removals) {
		return this.each(function() {
			var self = $(this),
				removed = [];

			if (removals.indexOf("*") === -1) self.removeAttr(removals);
			else {
				$.each(self.get(0).attributes, function(i, attr) {
					var ptn = new RegExp(removals.replace(/\*+/g, "[A-Za-z0-9-_]+").split(" ").join("|"), "ig");
					if (attr.specified && ptn.test(attr.name)) removed.push(attr.name);
				});

				$.each(removed, function(i, key) {
					self.removeAttr(key);
				});
			}
		});
	};
	$.fn.with = function(elems, action){ 
		return this.each(function(){
			$(elems, this).each(action);
		});
	};
})(jQuery);



/*
 * Prototypes
 *
 */

Number.prototype.zeroPad = function(length) {
	return ("" + this).zeroPad(length);
};
Number.prototype.isLeap = function() {
	return !(this & 3 || this & 15 && !(this % 25));
};
String.prototype.isLeap = function() {
	return Number(this).isLeap();
};
String.prototype.zeroPad = function(length) {
	length = length !== undefined ? length : 1;

	if (this.length >= length) return this;
	else return ("0" + this).slice(0 - length);
};
String.prototype.operand = function() {
	// https://stackoverflow.com/questions/21206207/javascript-falsy-values-null-undefined-false-empty-string-or-and-0-a

	var str = this;

	str = $.trim(str);

	if (str.toLowerCase() === "null" || str === "") return null;
	else if (str.toLowerCase() === "true") return true;
	else if (str.toLowerCase() === "false") return false;
	else if (str.toLowerCase() === "undefined") return undefined;
	else if ($.isNumeric(str)) return Number(str);
	else return this;
};
String.prototype.isEmail = function() {
	var str = this;

	str += "";

	if (/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(str)) return true;
	else return false;
};
Date.prototype.monthDays = function() {
	var date = new Date(this.getFullYear(), this.getMonth() + 1, 0);
	return date.getDate();
};
Date.prototype.addSeconds = function(seconds) {
	this.setSeconds(this.getSeconds() + seconds);
	return this;
};
Date.prototype.addMinutes = function(minutes) {
	this.setMinutes(this.getMinutes() + minutes);
	return this;
};
Date.prototype.addHours = function(hours) {
	this.setHours(this.getHours() + hours);
	return this;
};
Date.prototype.addDays = function(days) {
	this.setDate(this.getDate() + days);
	return this;
};
Date.prototype.addWeeks = function(weeks) {
	this.addDays(weeks*7);
	return this;
};
Date.prototype.addMonths = function (months) {
	var dt = this.getDate();

	this.setMonth(this.getMonth() + months);
	var currDt = this.getDate();

	if (dt !== currDt) {  
		this.addDays(-currDt);
	}

	return this;
};
Date.prototype.addYears = function(years) {
	var dt = this.getDate();

	this.setFullYear(this.getFullYear() + years);

	var currDt = this.getDate();

	if (dt !== currDt) {  
		this.addDays(-currDt);
	}

	return this;
};




FCMailer.ascii = function() {
	var __ascii__ = "";
	__ascii__ += "\n";
	__ascii__ += "  ______ _____ __  __       _ _                  ____    __\n";
	__ascii__ += " |  ____/ ____|  \\/  |     (_) |                |___ \\  / /\n";
	__ascii__ += " | |__ | |    | \\  / | __ _ _| | ___ _ __  __   ____) |/ /_\n";
	__ascii__ += " |  __|| |    | |\\/| |/ _` | | |/ _ \\ '__| \\ \\ / /__ <| '_ \\\n";
	__ascii__ += " | |   | |____| |  | | (_| | | |  __/ |     \\ V /___) | (_) |\n";
	__ascii__ += " |_|    \\_____|_|  |_|\\__,_|_|_|\\___|_|      \\_/|____(_)___/\n";
	__ascii__ += "\n";

	// console.log("%c%s", "color: #757575; font-size: 10px; font-weight: 600; font-family: Consolas, Menlo, Monaco, 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace, sans-serif, serif;", __ascii__);

	console.log("%c FCMailer %c v" + this.version + " %c", "margin-left: 5px; padding: 1px; color: #FEFEFE; font-size: 12px; line-height: 15px; background: #F79433; border-radius: 3px 0 0 3px;", "padding: 1px; color: #FEFEFE; font-size: 12px; line-height: 15px; background: #FF5722; border-radius: 0 3px 3px 0;", "background: transparent;");
}
FCMailer.ascii();

/*****************************
 *
 * Plugin extended
 *
 *****************************/

/* YubinBango - fixed by trung.styles */
/* URL data: https://yubinbango.github.io/yubinbango-data/data */
var t=[],YubinBango;!function(YubinBango){var n=function(){function n(t,n){if(void 0===t&&(t=""),this.URL="shared/yubinbango-data",this.g=[null,"北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"],t){var e=t.replace(/[\uFF10-\uFF19]/g,function(t){return String.fromCharCode(t.charCodeAt(0)-65248)}),r=e.match(/\d/g)?e.match(/\d/g):[],o=r.join(""),i=this.h(o);i?this.i(i,n):n(this.j())}}return n.prototype.h=function(t){if(7===t.length)return t},n.prototype.j=function(t,n,e,r,o){return void 0===t&&(t=""),void 0===n&&(n=""),void 0===e&&(e=""),void 0===r&&(r=""),void 0===o&&(o=""),{k:t,region:n,l:e,m:r,o:o}},n.prototype.p=function(t){return t&&t[0]&&t[1]?this.j(t[0],this.g[t[0]],t[1],t[2],t[3]):this.j()},n.prototype.q=function(t,n){window.$yubin=function(t){return n(t)};var e=document.createElement("script");e.setAttribute("type","text/javascript"),e.setAttribute("charset","UTF-8"),e.setAttribute("src",t),document.head.appendChild(e)},n.prototype.i=function(n,e){var r=this,o=n.substr(0,3);return o in t&&n in t[o]?e(this.p(t[o][n])):void this.q(this.URL+"/"+o+".js",function(i){return t[o]=i,e(r.p(i[n]))})},n}();YubinBango.Core=n}(YubinBango||(YubinBango={}));var n=["Japan","JP","JPN","JAPAN"],e=["p-region-id","p-region","p-locality","p-street-address","p-extended-address"],YubinBango;!function(YubinBango){var t=function(){function t(){this.s()}return t.prototype.s=function(){var n=this,e=document.querySelectorAll(".h-adr");[].map.call(e,function(e){if(n.t(e)){var r=e.querySelectorAll(".p-postal-code");r[r.length-1].addEventListener("keyup",function(e){t.prototype.u(n.v(e.target.parentNode))},!1)}})},t.prototype.v=function(t){return"FORM"===t.tagName||t.classList.contains("h-adr")?t:this.v(t.parentNode)},t.prototype.t=function(t){var e=t.querySelector(".p-country-name"),r=[e.innerHTML,e.value];return r.some(function(t){return n.indexOf(t)>=0})},t.prototype.u=function(t){var n=this,e=t.querySelectorAll(".p-postal-code");new YubinBango.Core(this.A(e),function(e){return n.B(t,e)})},t.prototype.A=function(t){return[].map.call(t,function(t){return t.value}).reduce(function(t,n){return t+n})},t.prototype.B=function(t,n){var r=[this.C,this.D];r.map(function(r){return e.map(function(e){return r(e,t,n)})})},t.prototype.C=function(t,n,e){if(e){var r=n.querySelectorAll("."+t);[].map.call(r,function(t){return t.value=""})}},t.prototype.D=function(t,n,e){var r={"p-region-id":e.k,"p-region":e.region,"p-locality":e.l,"p-street-address":e.m,"p-extended-address":e.o},o=n.querySelectorAll("."+t);[].map.call(o,function(n){return n.value+=r[t]?r[t]:""})},t}();YubinBango.MicroformatDom=t}(YubinBango||(YubinBango={})),document.addEventListener("DOMContentLoaded",function(){new YubinBango.MicroformatDom},!1);
//# sourceMappingURL=./yubinbango.js.map



var DateFormatter;!function(){"use strict";var e,t,a,n,r,o,i;o=864e5,i=3600,e=function(e,t){return"string"==typeof e&&"string"==typeof t&&e.toLowerCase()===t.toLowerCase()},t=function(e,a,n){var r=n||"0",o=e.toString();return o.length<a?t(r+o,a):o},a=function(e){var t,n;for(e=e||{},t=1;t<arguments.length;t++)if(n=arguments[t])for(var r in n)n.hasOwnProperty(r)&&("object"==typeof n[r]?a(e[r],n[r]):e[r]=n[r]);return e},n=function(e,t){for(var a=0;a<t.length;a++)if(t[a].toLowerCase()===e.toLowerCase())return a;return-1},r={dateSettings:{days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],daysShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],monthsShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],meridiem:["AM","PM"],ordinal:function(e){var t=e%10,a={1:"st",2:"nd",3:"rd"};return 1!==Math.floor(e%100/10)&&a[t]?a[t]:"th"}},separators:/[ \-+\/\.T:@]/g,validParts:/[dDjlNSwzWFmMntLoYyaABgGhHisueTIOPZcrU]/g,intParts:/[djwNzmnyYhHgGis]/g,tzParts:/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,tzClip:/[^-+\dA-Z]/g},(DateFormatter=function(e){var t=this,n=a(r,e);t.dateSettings=n.dateSettings,t.separators=n.separators,t.validParts=n.validParts,t.intParts=n.intParts,t.tzParts=n.tzParts,t.tzClip=n.tzClip}).prototype={constructor:DateFormatter,getMonth:function(e){var t,a=this;return 0===(t=n(e,a.dateSettings.monthsShort)+1)&&(t=n(e,a.dateSettings.months)+1),t},parseDate:function(t,a){var n,r,o,i,s,d,u,l,f,c,m=this,h=!1,g=!1,p=m.dateSettings,y={date:null,year:null,month:null,day:null,hour:0,min:0,sec:0};if(!t)return null;if(t instanceof Date)return t;if("U"===a)return(o=parseInt(t))?new Date(1e3*o):t;switch(typeof t){case"number":return new Date(t);case"string":break;default:return null}if(!(n=a.match(m.validParts))||0===n.length)throw new Error("Invalid date format definition.");for(r=t.replace(m.separators,"\0").split("\0"),o=0;o<r.length;o++)switch(i=r[o],s=parseInt(i),n[o]){case"y":case"Y":if(!s)return null;f=i.length,y.year=2===f?parseInt((70>s?"20":"19")+i):s,h=!0;break;case"m":case"n":case"M":case"F":if(isNaN(s)){if(!((d=m.getMonth(i))>0))return null;y.month=d}else{if(!(s>=1&&12>=s))return null;y.month=s}h=!0;break;case"d":case"j":if(!(s>=1&&31>=s))return null;y.day=s,h=!0;break;case"g":case"h":if(u=n.indexOf("a")>-1?n.indexOf("a"):n.indexOf("A")>-1?n.indexOf("A"):-1,c=r[u],u>-1)l=e(c,p.meridiem[0])?0:e(c,p.meridiem[1])?12:-1,s>=1&&12>=s&&l>-1?y.hour=s+l-1:s>=0&&23>=s&&(y.hour=s);else{if(!(s>=0&&23>=s))return null;y.hour=s}g=!0;break;case"G":case"H":if(!(s>=0&&23>=s))return null;y.hour=s,g=!0;break;case"i":if(!(s>=0&&59>=s))return null;y.min=s,g=!0;break;case"s":if(!(s>=0&&59>=s))return null;y.sec=s,g=!0}if(!0===h&&y.year&&y.month&&y.day)y.date=new Date(y.year,y.month-1,y.day,y.hour,y.min,y.sec,0);else{if(!0!==g)return null;y.date=new Date(0,0,0,y.hour,y.min,y.sec,0)}return y.date},guessDate:function(e,t){if("string"!=typeof e)return e;var a,n,r,o,i,s,d=this,u=e.replace(d.separators,"\0").split("\0"),l=/^[djmn]/g,f=t.match(d.validParts),c=new Date,m=0;if(!l.test(f[0]))return e;for(r=0;r<u.length;r++){if(m=2,i=u[r],s=parseInt(i.substr(0,2)),isNaN(s))return null;switch(r){case 0:"m"===f[0]||"n"===f[0]?c.setMonth(s-1):c.setDate(s);break;case 1:"m"===f[0]||"n"===f[0]?c.setDate(s):c.setMonth(s-1);break;case 2:if(n=c.getFullYear(),a=i.length,m=4>a?a:4,!(n=parseInt(4>a?n.toString().substr(0,4-a)+i:i.substr(0,4))))return null;c.setFullYear(n);break;case 3:c.setHours(s);break;case 4:c.setMinutes(s);break;case 5:c.setSeconds(s)}(o=i.substr(m)).length>0&&u.splice(r+1,0,o)}return c},parseFormat:function(e,a){var n,r=this,s=r.dateSettings,d=/\\?(.?)/gi,u=function(e,t){return n[e]?n[e]():t};return n={d:function(){return t(n.j(),2)},D:function(){return s.daysShort[n.w()]},j:function(){return a.getDate()},l:function(){return s.days[n.w()]},N:function(){return n.w()||7},w:function(){return a.getDay()},z:function(){var e=new Date(n.Y(),n.n()-1,n.j()),t=new Date(n.Y(),0,1);return Math.round((e-t)/o)},W:function(){var e=new Date(n.Y(),n.n()-1,n.j()-n.N()+3),a=new Date(e.getFullYear(),0,4);return t(1+Math.round((e-a)/o/7),2)},F:function(){return s.months[a.getMonth()]},m:function(){return t(n.n(),2)},M:function(){return s.monthsShort[a.getMonth()]},n:function(){return a.getMonth()+1},t:function(){return new Date(n.Y(),n.n(),0).getDate()},L:function(){var e=n.Y();return e%4==0&&e%100!=0||e%400==0?1:0},o:function(){var e=n.n(),t=n.W();return n.Y()+(12===e&&9>t?1:1===e&&t>9?-1:0)},Y:function(){return a.getFullYear()},y:function(){return n.Y().toString().slice(-2)},a:function(){return n.A().toLowerCase()},A:function(){var e=n.G()<12?0:1;return s.meridiem[e]},B:function(){var e=a.getUTCHours()*i,n=60*a.getUTCMinutes(),r=a.getUTCSeconds();return t(Math.floor((e+n+r+i)/86.4)%1e3,3)},g:function(){return n.G()%12||12},G:function(){return a.getHours()},h:function(){return t(n.g(),2)},H:function(){return t(n.G(),2)},i:function(){return t(a.getMinutes(),2)},s:function(){return t(a.getSeconds(),2)},u:function(){return t(1e3*a.getMilliseconds(),6)},e:function(){return/\((.*)\)/.exec(String(a))[1]||"Coordinated Universal Time"},I:function(){return new Date(n.Y(),0)-Date.UTC(n.Y(),0)!=new Date(n.Y(),6)-Date.UTC(n.Y(),6)?1:0},O:function(){var e=a.getTimezoneOffset(),n=Math.abs(e);return(e>0?"-":"+")+t(100*Math.floor(n/60)+n%60,4)},P:function(){var e=n.O();return e.substr(0,3)+":"+e.substr(3,2)},T:function(){return(String(a).match(r.tzParts)||[""]).pop().replace(r.tzClip,"")||"UTC"},Z:function(){return 60*-a.getTimezoneOffset()},c:function(){return"Y-m-d\\TH:i:sP".replace(d,u)},r:function(){return"D, d M Y H:i:s O".replace(d,u)},U:function(){return a.getTime()/1e3||0}},u(e,e)},formatDate:function(e,t){var a,n,r,o,i,s=this,d="";if("string"==typeof e&&!(e=s.parseDate(e,t)))return null;if(e instanceof Date){for(r=t.length,a=0;r>a;a++)"S"!==(i=t.charAt(a))&&"\\"!==i&&(a>0&&"\\"===t.charAt(a-1)?d+=i:(o=s.parseFormat(i,e),a!==r-1&&s.intParts.test(i)&&"S"===t.charAt(a+1)&&(n=parseInt(o)||0,o+=s.dateSettings.ordinal(n)),d+=o));return d}return""}}}();var datetimepickerFactory=function(e){"use strict";function t(e,t,a){this.date=e,this.desc=t,this.style=a}var a={i18n:{ar:{months:["كانون الثاني","شباط","آذار","نيسان","مايو","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"],dayOfWeekShort:["ن","ث","ع","خ","ج","س","ح"],dayOfWeek:["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"]},ro:{months:["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"],dayOfWeekShort:["Du","Lu","Ma","Mi","Jo","Vi","Sâ"],dayOfWeek:["Duminică","Luni","Marţi","Miercuri","Joi","Vineri","Sâmbătă"]},id:{months:["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"],dayOfWeekShort:["Min","Sen","Sel","Rab","Kam","Jum","Sab"],dayOfWeek:["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"]},is:{months:["Janúar","Febrúar","Mars","Apríl","Maí","Júní","Júlí","Ágúst","September","Október","Nóvember","Desember"],dayOfWeekShort:["Sun","Mán","Þrið","Mið","Fim","Fös","Lau"],dayOfWeek:["Sunnudagur","Mánudagur","Þriðjudagur","Miðvikudagur","Fimmtudagur","Föstudagur","Laugardagur"]},bg:{months:["Януари","Февруари","Март","Април","Май","Юни","Юли","Август","Септември","Октомври","Ноември","Декември"],dayOfWeekShort:["Нд","Пн","Вт","Ср","Чт","Пт","Сб"],dayOfWeek:["Неделя","Понеделник","Вторник","Сряда","Четвъртък","Петък","Събота"]},fa:{months:["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"],dayOfWeekShort:["یکشنبه","دوشنبه","سه شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"],dayOfWeek:["یک‌شنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه","شنبه","یک‌شنبه"]},ru:{months:["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],dayOfWeekShort:["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],dayOfWeek:["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"]},uk:{months:["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"],dayOfWeekShort:["Ндл","Пнд","Втр","Срд","Чтв","Птн","Сбт"],dayOfWeek:["Неділя","Понеділок","Вівторок","Середа","Четвер","П'ятниця","Субота"]},en:{months:["January","February","March","April","May","June","July","August","September","October","November","December"],dayOfWeekShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayOfWeek:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},el:{months:["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"],dayOfWeekShort:["Κυρ","Δευ","Τρι","Τετ","Πεμ","Παρ","Σαβ"],dayOfWeek:["Κυριακή","Δευτέρα","Τρίτη","Τετάρτη","Πέμπτη","Παρασκευή","Σάββατο"]},de:{months:["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],dayOfWeekShort:["So","Mo","Di","Mi","Do","Fr","Sa"],dayOfWeek:["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"]},nl:{months:["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"],dayOfWeekShort:["zo","ma","di","wo","do","vr","za"],dayOfWeek:["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"]},tr:{months:["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],dayOfWeekShort:["Paz","Pts","Sal","Çar","Per","Cum","Cts"],dayOfWeek:["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"]},fr:{months:["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],dayOfWeekShort:["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],dayOfWeek:["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"]},es:{months:["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],dayOfWeekShort:["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],dayOfWeek:["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]},th:{months:["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"],dayOfWeekShort:["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."],dayOfWeek:["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์","อาทิตย์"]},pl:{months:["styczeń","luty","marzec","kwiecień","maj","czerwiec","lipiec","sierpień","wrzesień","październik","listopad","grudzień"],dayOfWeekShort:["nd","pn","wt","śr","cz","pt","sb"],dayOfWeek:["niedziela","poniedziałek","wtorek","środa","czwartek","piątek","sobota"]},pt:{months:["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],dayOfWeekShort:["Dom","Seg","Ter","Qua","Qui","Sex","Sab"],dayOfWeek:["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]},ch:{months:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],dayOfWeekShort:["日","一","二","三","四","五","六"]},se:{months:["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"],dayOfWeekShort:["Sön","Mån","Tis","Ons","Tor","Fre","Lör"]},km:{months:["មករា​","កុម្ភៈ","មិនា​","មេសា​","ឧសភា​","មិថុនា​","កក្កដា​","សីហា​","កញ្ញា​","តុលា​","វិច្ឆិកា","ធ្នូ​"],dayOfWeekShort:["អាទិ​","ច័ន្ទ​","អង្គារ​","ពុធ​","ព្រហ​​","សុក្រ​","សៅរ៍"],dayOfWeek:["អាទិត្យ​","ច័ន្ទ​","អង្គារ​","ពុធ​","ព្រហស្បតិ៍​","សុក្រ​","សៅរ៍"]},kr:{months:["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],dayOfWeekShort:["일","월","화","수","목","금","토"],dayOfWeek:["일요일","월요일","화요일","수요일","목요일","금요일","토요일"]},it:{months:["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"],dayOfWeekShort:["Dom","Lun","Mar","Mer","Gio","Ven","Sab"],dayOfWeek:["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"]},da:{months:["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"],dayOfWeekShort:["Søn","Man","Tir","Ons","Tor","Fre","Lør"],dayOfWeek:["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"]},no:{months:["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"],dayOfWeekShort:["Søn","Man","Tir","Ons","Tor","Fre","Lør"],dayOfWeek:["Søndag","Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag"]},ja:{months:["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],dayOfWeekShort:["日","月","火","水","木","金","土"],dayOfWeek:["日曜","月曜","火曜","水曜","木曜","金曜","土曜"]},vi:{months:["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"],dayOfWeekShort:["CN","T2","T3","T4","T5","T6","T7"],dayOfWeek:["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"]},sl:{months:["Januar","Februar","Marec","April","Maj","Junij","Julij","Avgust","September","Oktober","November","December"],dayOfWeekShort:["Ned","Pon","Tor","Sre","Čet","Pet","Sob"],dayOfWeek:["Nedelja","Ponedeljek","Torek","Sreda","Četrtek","Petek","Sobota"]},cs:{months:["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"],dayOfWeekShort:["Ne","Po","Út","St","Čt","Pá","So"]},hu:{months:["Január","Február","Március","Április","Május","Június","Július","Augusztus","Szeptember","Október","November","December"],dayOfWeekShort:["Va","Hé","Ke","Sze","Cs","Pé","Szo"],dayOfWeek:["vasárnap","hétfő","kedd","szerda","csütörtök","péntek","szombat"]},az:{months:["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"],dayOfWeekShort:["B","Be","Ça","Ç","Ca","C","Ş"],dayOfWeek:["Bazar","Bazar ertəsi","Çərşənbə axşamı","Çərşənbə","Cümə axşamı","Cümə","Şənbə"]},bs:{months:["Januar","Februar","Mart","April","Maj","Jun","Jul","Avgust","Septembar","Oktobar","Novembar","Decembar"],dayOfWeekShort:["Ned","Pon","Uto","Sri","Čet","Pet","Sub"],dayOfWeek:["Nedjelja","Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"]},ca:{months:["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"],dayOfWeekShort:["Dg","Dl","Dt","Dc","Dj","Dv","Ds"],dayOfWeek:["Diumenge","Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte"]},"en-GB":{months:["January","February","March","April","May","June","July","August","September","October","November","December"],dayOfWeekShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayOfWeek:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},et:{months:["Jaanuar","Veebruar","Märts","Aprill","Mai","Juuni","Juuli","August","September","Oktoober","November","Detsember"],dayOfWeekShort:["P","E","T","K","N","R","L"],dayOfWeek:["Pühapäev","Esmaspäev","Teisipäev","Kolmapäev","Neljapäev","Reede","Laupäev"]},eu:{months:["Urtarrila","Otsaila","Martxoa","Apirila","Maiatza","Ekaina","Uztaila","Abuztua","Iraila","Urria","Azaroa","Abendua"],dayOfWeekShort:["Ig.","Al.","Ar.","Az.","Og.","Or.","La."],dayOfWeek:["Igandea","Astelehena","Asteartea","Asteazkena","Osteguna","Ostirala","Larunbata"]},fi:{months:["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"],dayOfWeekShort:["Su","Ma","Ti","Ke","To","Pe","La"],dayOfWeek:["sunnuntai","maanantai","tiistai","keskiviikko","torstai","perjantai","lauantai"]},gl:{months:["Xan","Feb","Maz","Abr","Mai","Xun","Xul","Ago","Set","Out","Nov","Dec"],dayOfWeekShort:["Dom","Lun","Mar","Mer","Xov","Ven","Sab"],dayOfWeek:["Domingo","Luns","Martes","Mércores","Xoves","Venres","Sábado"]},hr:{months:["Siječanj","Veljača","Ožujak","Travanj","Svibanj","Lipanj","Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac"],dayOfWeekShort:["Ned","Pon","Uto","Sri","Čet","Pet","Sub"],dayOfWeek:["Nedjelja","Ponedjeljak","Utorak","Srijeda","Četvrtak","Petak","Subota"]},ko:{months:["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],dayOfWeekShort:["일","월","화","수","목","금","토"],dayOfWeek:["일요일","월요일","화요일","수요일","목요일","금요일","토요일"]},lt:{months:["Sausio","Vasario","Kovo","Balandžio","Gegužės","Birželio","Liepos","Rugpjūčio","Rugsėjo","Spalio","Lapkričio","Gruodžio"],dayOfWeekShort:["Sek","Pir","Ant","Tre","Ket","Pen","Šeš"],dayOfWeek:["Sekmadienis","Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis"]},lv:{months:["Janvāris","Februāris","Marts","Aprīlis ","Maijs","Jūnijs","Jūlijs","Augusts","Septembris","Oktobris","Novembris","Decembris"],dayOfWeekShort:["Sv","Pr","Ot","Tr","Ct","Pk","St"],dayOfWeek:["Svētdiena","Pirmdiena","Otrdiena","Trešdiena","Ceturtdiena","Piektdiena","Sestdiena"]},mk:{months:["јануари","февруари","март","април","мај","јуни","јули","август","септември","октомври","ноември","декември"],dayOfWeekShort:["нед","пон","вто","сре","чет","пет","саб"],dayOfWeek:["Недела","Понеделник","Вторник","Среда","Четврток","Петок","Сабота"]},mn:{months:["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"],dayOfWeekShort:["Дав","Мяг","Лха","Пүр","Бсн","Бям","Ням"],dayOfWeek:["Даваа","Мягмар","Лхагва","Пүрэв","Баасан","Бямба","Ням"]},"pt-BR":{months:["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],dayOfWeekShort:["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],dayOfWeek:["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"]},sk:{months:["Január","Február","Marec","Apríl","Máj","Jún","Júl","August","September","Október","November","December"],dayOfWeekShort:["Ne","Po","Ut","St","Št","Pi","So"],dayOfWeek:["Nedeľa","Pondelok","Utorok","Streda","Štvrtok","Piatok","Sobota"]},sq:{months:["Janar","Shkurt","Mars","Prill","Maj","Qershor","Korrik","Gusht","Shtator","Tetor","Nëntor","Dhjetor"],dayOfWeekShort:["Die","Hën","Mar","Mër","Enj","Pre","Shtu"],dayOfWeek:["E Diel","E Hënë","E Martē","E Mërkurë","E Enjte","E Premte","E Shtunë"]},"sr-YU":{months:["Januar","Februar","Mart","April","Maj","Jun","Jul","Avgust","Septembar","Oktobar","Novembar","Decembar"],dayOfWeekShort:["Ned","Pon","Uto","Sre","čet","Pet","Sub"],dayOfWeek:["Nedelja","Ponedeljak","Utorak","Sreda","Četvrtak","Petak","Subota"]},sr:{months:["јануар","фебруар","март","април","мај","јун","јул","август","септембар","октобар","новембар","децембар"],dayOfWeekShort:["нед","пон","уто","сре","чет","пет","суб"],dayOfWeek:["Недеља","Понедељак","Уторак","Среда","Четвртак","Петак","Субота"]},sv:{months:["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"],dayOfWeekShort:["Sön","Mån","Tis","Ons","Tor","Fre","Lör"],dayOfWeek:["Söndag","Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag"]},"zh-TW":{months:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],dayOfWeekShort:["日","一","二","三","四","五","六"],dayOfWeek:["星期日","星期一","星期二","星期三","星期四","星期五","星期六"]},zh:{months:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],dayOfWeekShort:["日","一","二","三","四","五","六"],dayOfWeek:["星期日","星期一","星期二","星期三","星期四","星期五","星期六"]},ug:{months:["1-ئاي","2-ئاي","3-ئاي","4-ئاي","5-ئاي","6-ئاي","7-ئاي","8-ئاي","9-ئاي","10-ئاي","11-ئاي","12-ئاي"],dayOfWeek:["يەكشەنبە","دۈشەنبە","سەيشەنبە","چارشەنبە","پەيشەنبە","جۈمە","شەنبە"]},he:{months:["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"],dayOfWeekShort:["א'","ב'","ג'","ד'","ה'","ו'","שבת"],dayOfWeek:["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת","ראשון"]},hy:{months:["Հունվար","Փետրվար","Մարտ","Ապրիլ","Մայիս","Հունիս","Հուլիս","Օգոստոս","Սեպտեմբեր","Հոկտեմբեր","Նոյեմբեր","Դեկտեմբեր"],dayOfWeekShort:["Կի","Երկ","Երք","Չոր","Հնգ","Ուրբ","Շբթ"],dayOfWeek:["Կիրակի","Երկուշաբթի","Երեքշաբթի","Չորեքշաբթի","Հինգշաբթի","Ուրբաթ","Շաբաթ"]},kg:{months:["Үчтүн айы","Бирдин айы","Жалган Куран","Чын Куран","Бугу","Кулжа","Теке","Баш Оона","Аяк Оона","Тогуздун айы","Жетинин айы","Бештин айы"],dayOfWeekShort:["Жек","Дүй","Шей","Шар","Бей","Жум","Ише"],dayOfWeek:["Жекшемб","Дүйшөмб","Шейшемб","Шаршемб","Бейшемби","Жума","Ишенб"]},rm:{months:["Schaner","Favrer","Mars","Avrigl","Matg","Zercladur","Fanadur","Avust","Settember","October","November","December"],dayOfWeekShort:["Du","Gli","Ma","Me","Gie","Ve","So"],dayOfWeek:["Dumengia","Glindesdi","Mardi","Mesemna","Gievgia","Venderdi","Sonda"]},ka:{months:["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"],dayOfWeekShort:["კვ","ორშ","სამშ","ოთხ","ხუთ","პარ","შაბ"],dayOfWeek:["კვირა","ორშაბათი","სამშაბათი","ოთხშაბათი","ხუთშაბათი","პარასკევი","შაბათი"]}},ownerDocument:document,contentWindow:window,value:"",rtl:!1,format:"Y/m/d H:i",formatTime:"H:i",formatDate:"Y/m/d",startDate:!1,step:60,monthChangeSpinner:!0,closeOnDateSelect:!1,closeOnTimeSelect:!0,closeOnWithoutClick:!0,closeOnInputClick:!0,timepicker:!0,datepicker:!0,weeks:!1,defaultTime:!1,defaultDate:!1,minDate:!1,maxDate:!1,minTime:!1,maxTime:!1,minDateTime:!1,disabledMinTime:!1,disabledMaxTime:!1,allowTimes:[],opened:!1,initTime:!0,inline:!1,theme:"",onSelectDate:function(){},onSelectTime:function(){},onChangeMonth:function(){},onGetWeekOfYear:function(){},onChangeYear:function(){},onChangeDateTime:function(){},onShow:function(){},onClose:function(){},onGenerate:function(){},withoutCopyright:!0,inverseButton:!1,hours12:!1,next:"xdsoft_next",prev:"xdsoft_prev",dayOfWeekStart:0,parentID:"body",timeHeightInTimePicker:25,timepickerScrollbar:!0,todayButton:!0,prevButton:!0,nextButton:!0,defaultSelect:!0,scrollMonth:!0,scrollTime:!0,scrollInput:!0,lazyInit:!1,mask:!1,validateOnBlur:!0,allowBlank:!0,yearStart:1950,yearEnd:2050,monthStart:0,monthEnd:11,style:"",id:"",fixed:!1,roundTime:"round",className:"",weekends:[],highlightedDates:[],highlightedPeriods:[],allowDates:[],allowDateRe:null,disabledDates:[],disabledWeekDays:[],yearOffset:0,beforeShowDay:null,enterLikeTab:!0,showApplyButton:!1},n=null,r="en",o={meridiem:["AM","PM"]},i=function(){var t=a.i18n[r],i={days:t.dayOfWeek,daysShort:t.dayOfWeekShort,months:t.months,monthsShort:e.map(t.months,function(e){return e.substring(0,3)})};"function"==typeof DateFormatter&&(n=new DateFormatter({dateSettings:e.extend({},o,i)}))};e.datetimepicker={setLocale:function(e){var t=a.i18n[e]?e:"en";r!==t&&(r=t,i())},setDateFormatter:function(e){n=e},RFC_2822:"D, d M Y H:i:s O",ATOM:"Y-m-dTH:i:sP",ISO_8601:"Y-m-dTH:i:sO",RFC_822:"D, d M y H:i:s O",RFC_850:"l, d-M-y H:i:s T",RFC_1036:"D, d M y H:i:s O",RFC_1123:"D, d M Y H:i:s O",RSS:"D, d M Y H:i:s O",W3C:"Y-m-dTH:i:sP"},i(),window.getComputedStyle||(window.getComputedStyle=function(e){return this.el=e,this.getPropertyValue=function(t){var a=/(-([a-z]))/g;return"float"===t&&(t="styleFloat"),a.test(t)&&(t=t.replace(a,function(e,t,a){return a.toUpperCase()})),e.currentStyle[t]||null},this}),Array.prototype.indexOf||(Array.prototype.indexOf=function(e,t){var a,n;for(a=t||0,n=this.length;a<n;a+=1)if(this[a]===e)return a;return-1}),Date.prototype.countDaysInMonth=function(){return new Date(this.getFullYear(),this.getMonth()+1,0).getDate()},e.fn.xdsoftScroller=function(t,a){return this.each(function(){var n,r,o,i,s,d=e(this),u=function(e){var t,a={x:0,y:0};return"touchstart"===e.type||"touchmove"===e.type||"touchend"===e.type||"touchcancel"===e.type?(t=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0],a.x=t.clientX,a.y=t.clientY):"mousedown"!==e.type&&"mouseup"!==e.type&&"mousemove"!==e.type&&"mouseover"!==e.type&&"mouseout"!==e.type&&"mouseenter"!==e.type&&"mouseleave"!==e.type||(a.x=e.clientX,a.y=e.clientY),a},l=100,f=!1,c=0,m=0,h=0,g=!1,p=0,y=function(){};"hide"!==a?(e(this).hasClass("xdsoft_scroller_box")||(n=d.children().eq(0),r=d[0].clientHeight,o=n[0].offsetHeight,i=e('<div class="xdsoft_scrollbar"></div>'),s=e('<div class="xdsoft_scroller"></div>'),i.append(s),d.addClass("xdsoft_scroller_box").append(i),y=function(e){var t=u(e).y-c+p;t<0&&(t=0),t+s[0].offsetHeight>h&&(t=h-s[0].offsetHeight),d.trigger("scroll_element.xdsoft_scroller",[l?t/l:0])},s.on("touchstart.xdsoft_scroller mousedown.xdsoft_scroller",function(n){r||d.trigger("resize_scroll.xdsoft_scroller",[a]),c=u(n).y,p=parseInt(s.css("margin-top"),10),h=i[0].offsetHeight,"mousedown"===n.type||"touchstart"===n.type?(t.ownerDocument&&e(t.ownerDocument.body).addClass("xdsoft_noselect"),e([t.ownerDocument.body,t.contentWindow]).on("touchend mouseup.xdsoft_scroller",function a(){e([t.ownerDocument.body,t.contentWindow]).off("touchend mouseup.xdsoft_scroller",a).off("mousemove.xdsoft_scroller",y).removeClass("xdsoft_noselect")}),e(t.ownerDocument.body).on("mousemove.xdsoft_scroller",y)):(g=!0,n.stopPropagation(),n.preventDefault())}).on("touchmove",function(e){g&&(e.preventDefault(),y(e))}).on("touchend touchcancel",function(){g=!1,p=0}),d.on("scroll_element.xdsoft_scroller",function(e,t){r||d.trigger("resize_scroll.xdsoft_scroller",[t,!0]),t=t>1?1:t<0||isNaN(t)?0:t,s.css("margin-top",l*t),setTimeout(function(){n.css("marginTop",-parseInt((n[0].offsetHeight-r)*t,10))},10)}).on("resize_scroll.xdsoft_scroller",function(e,t,a){var u,f;r=d[0].clientHeight,o=n[0].offsetHeight,f=(u=r/o)*i[0].offsetHeight,u>1?s.hide():(s.show(),s.css("height",parseInt(f>10?f:10,10)),l=i[0].offsetHeight-s[0].offsetHeight,!0!==a&&d.trigger("scroll_element.xdsoft_scroller",[t||Math.abs(parseInt(n.css("marginTop"),10))/(o-r)]))}),d.on("mousewheel",function(e){var t=Math.abs(parseInt(n.css("marginTop"),10));return(t-=20*e.deltaY)<0&&(t=0),d.trigger("scroll_element.xdsoft_scroller",[t/(o-r)]),e.stopPropagation(),!1}),d.on("touchstart",function(e){f=u(e),m=Math.abs(parseInt(n.css("marginTop"),10))}),d.on("touchmove",function(e){if(f){e.preventDefault();var t=u(e);d.trigger("scroll_element.xdsoft_scroller",[(m-(t.y-f.y))/(o-r)])}}),d.on("touchend touchcancel",function(){f=!1,m=0})),d.trigger("resize_scroll.xdsoft_scroller",[a])):d.find(".xdsoft_scrollbar").hide()})},e.fn.datetimepicker=function(o,i){var s,d,u=this,l=48,f=57,c=96,m=105,h=17,g=46,p=13,y=27,D=8,v=37,b=38,k=39,x=40,T=9,S=116,w=65,M=67,O=86,W=90,_=89,F=!1,C=e.isPlainObject(o)||!o?e.extend(!0,{},a,o):e.extend(!0,{},a),P=0,A=function(e){e.on("open.xdsoft focusin.xdsoft mousedown.xdsoft touchstart",function t(){e.is(":disabled")||e.data("xdsoft_datetimepicker")||(clearTimeout(P),P=setTimeout(function(){e.data("xdsoft_datetimepicker")||s(e),e.off("open.xdsoft focusin.xdsoft mousedown.xdsoft touchstart",t).trigger("open.xdsoft")},100))})};return s=function(a){function i(){var e,t=!1;return C.startDate?t=Y.strToDate(C.startDate):(t=C.value||(a&&a.val&&a.val()?a.val():""))?t=Y.strToDateTime(t):C.defaultDate&&(t=Y.strToDateTime(C.defaultDate),C.defaultTime&&(e=Y.strtotime(C.defaultTime),t.setHours(e.getHours()),t.setMinutes(e.getMinutes()))),t&&Y.isValidDate(t)?H.data("changed",!0):t="",t||0}function s(t){var n=function(e,t){var a=e.replace(/([\[\]\/\{\}\(\)\-\.\+]{1})/g,"\\$1").replace(/_/g,"{digit+}").replace(/([0-9]{1})/g,"{digit$1}").replace(/\{digit([0-9]{1})\}/g,"[0-$1_]{1}").replace(/\{digit[\+]\}/g,"[0-9_]{1}");return new RegExp(a).test(t)},r=function(e){try{if(t.ownerDocument.selection&&t.ownerDocument.selection.createRange)return t.ownerDocument.selection.createRange().getBookmark().charCodeAt(2)-2;if(e.setSelectionRange)return e.selectionStart}catch(e){return 0}},o=function(e,a){if(!(e="string"==typeof e||e instanceof String?t.ownerDocument.getElementById(e):e))return!1;if(e.createTextRange){var n=e.createTextRange();return n.collapse(!0),n.moveEnd("character",a),n.moveStart("character",a),n.select(),!0}return!!e.setSelectionRange&&(e.setSelectionRange(a,a),!0)};t.mask&&a.off("keydown.xdsoft"),!0===t.mask&&("undefined"!=typeof moment?t.mask=t.format.replace(/Y{4}/g,"9999").replace(/Y{2}/g,"99").replace(/M{2}/g,"19").replace(/D{2}/g,"39").replace(/H{2}/g,"29").replace(/m{2}/g,"59").replace(/s{2}/g,"59"):t.mask=t.format.replace(/Y/g,"9999").replace(/F/g,"9999").replace(/m/g,"19").replace(/d/g,"39").replace(/H/g,"29").replace(/i/g,"59").replace(/s/g,"59")),"string"===e.type(t.mask)&&(n(t.mask,a.val())||(a.val(t.mask.replace(/[0-9]/g,"_")),o(a[0],0)),a.on("keydown.xdsoft",function(i){var s,d,u=this.value,C=i.which;if(C>=l&&C<=f||C>=c&&C<=m||C===D||C===g){for(s=r(this),d=C!==D&&C!==g?String.fromCharCode(c<=C&&C<=m?C-l:C):"_",C!==D&&C!==g||!s||(s-=1,d="_");/[^0-9_]/.test(t.mask.substr(s,1))&&s<t.mask.length&&s>0;)s+=C===D||C===g?-1:1;if(u=u.substr(0,s)+d+u.substr(s+1),""===e.trim(u))u=t.mask.replace(/[0-9]/g,"_");else if(s===t.mask.length)return i.preventDefault(),!1;for(s+=C===D||C===g?0:1;/[^0-9_]/.test(t.mask.substr(s,1))&&s<t.mask.length&&s>0;)s+=C===D||C===g?-1:1;n(t.mask,u)?(this.value=u,o(this,s)):""===e.trim(u)?this.value=t.mask.replace(/[0-9]/g,"_"):a.trigger("error_input.xdsoft")}else if(-1!==[w,M,O,W,_].indexOf(C)&&F||-1!==[y,b,x,v,k,S,h,T,p].indexOf(C))return!0;return i.preventDefault(),!1}))}var d,u,P,A,Y,j,H=e('<div class="xdsoft_datetimepicker xdsoft_noselect"></div>'),J=e('<div class="xdsoft_copyright"><a target="_blank" href="http://xdsoft.net/jqplugins/datetimepicker/">xdsoft.net</a></div>'),z=e('<div class="xdsoft_datepicker active"></div>'),I=e('<div class="xdsoft_monthpicker"><button type="button" class="xdsoft_prev"></button><button type="button" class="xdsoft_today_button"></button><div class="xdsoft_label xdsoft_month"><span></span><i></i></div><div class="xdsoft_label xdsoft_year"><span></span><i></i></div><button type="button" class="xdsoft_next"></button></div>'),N=e('<div class="xdsoft_calendar"></div>'),L=e('<div class="xdsoft_timepicker active"><button type="button" class="xdsoft_prev"></button><div class="xdsoft_time_box"></div><button type="button" class="xdsoft_next"></button></div>'),E=L.find(".xdsoft_time_box").eq(0),R=e('<div class="xdsoft_time_variant"></div>'),B=e('<button type="button" class="xdsoft_save_selected blue-gradient-button">Save Selected</button>'),V=e('<div class="xdsoft_select xdsoft_monthselect"><div></div></div>'),G=e('<div class="xdsoft_select xdsoft_yearselect"><div></div></div>'),U=!1,q=0;C.id&&H.attr("id",C.id),C.style&&H.attr("style",C.style),C.weeks&&H.addClass("xdsoft_showweeks"),C.rtl&&H.addClass("xdsoft_rtl"),H.addClass("xdsoft_"+C.theme),H.addClass(C.className),I.find(".xdsoft_month span").after(V),I.find(".xdsoft_year span").after(G),I.find(".xdsoft_month,.xdsoft_year").on("touchstart mousedown.xdsoft",function(t){var a,n,r=e(this).find(".xdsoft_select").eq(0),o=0,i=0,s=r.is(":visible");for(I.find(".xdsoft_select").hide(),Y.currentTime&&(o=Y.currentTime[e(this).hasClass("xdsoft_month")?"getMonth":"getFullYear"]()),r[s?"hide":"show"](),a=r.find("div.xdsoft_option"),n=0;n<a.length&&a.eq(n).data("value")!==o;n+=1)i+=a[0].offsetHeight;return r.xdsoftScroller(C,i/(r.children()[0].offsetHeight-r[0].clientHeight)),t.stopPropagation(),!1}),I.find(".xdsoft_select").xdsoftScroller(C).on("touchstart mousedown.xdsoft",function(e){e.stopPropagation(),e.preventDefault()}).on("touchstart mousedown.xdsoft",".xdsoft_option",function(){void 0!==Y.currentTime&&null!==Y.currentTime||(Y.currentTime=Y.now());var t=Y.currentTime.getFullYear();Y&&Y.currentTime&&Y.currentTime[e(this).parent().parent().hasClass("xdsoft_monthselect")?"setMonth":"setFullYear"](e(this).data("value")),e(this).parent().parent().hide(),H.trigger("xchange.xdsoft"),C.onChangeMonth&&e.isFunction(C.onChangeMonth)&&C.onChangeMonth.call(H,Y.currentTime,H.data("input")),t!==Y.currentTime.getFullYear()&&e.isFunction(C.onChangeYear)&&C.onChangeYear.call(H,Y.currentTime,H.data("input"))}),H.getValue=function(){return Y.getCurrentTime()},H.setOptions=function(r){var o={};C=e.extend(!0,{},C,r),r.allowTimes&&e.isArray(r.allowTimes)&&r.allowTimes.length&&(C.allowTimes=e.extend(!0,[],r.allowTimes)),r.weekends&&e.isArray(r.weekends)&&r.weekends.length&&(C.weekends=e.extend(!0,[],r.weekends)),r.allowDates&&e.isArray(r.allowDates)&&r.allowDates.length&&(C.allowDates=e.extend(!0,[],r.allowDates)),r.allowDateRe&&"[object String]"===Object.prototype.toString.call(r.allowDateRe)&&(C.allowDateRe=new RegExp(r.allowDateRe)),r.highlightedDates&&e.isArray(r.highlightedDates)&&r.highlightedDates.length&&(e.each(r.highlightedDates,function(a,r){var i,s=e.map(r.split(","),e.trim),d=new t(n.parseDate(s[0],C.formatDate),s[1],s[2]),u=n.formatDate(d.date,C.formatDate);void 0!==o[u]?(i=o[u].desc)&&i.length&&d.desc&&d.desc.length&&(o[u].desc=i+"\n"+d.desc):o[u]=d}),C.highlightedDates=e.extend(!0,[],o)),r.highlightedPeriods&&e.isArray(r.highlightedPeriods)&&r.highlightedPeriods.length&&(o=e.extend(!0,[],C.highlightedDates),e.each(r.highlightedPeriods,function(a,r){var i,s,d,u,l,f,c;if(e.isArray(r))i=r[0],s=r[1],d=r[2],c=r[3];else{var m=e.map(r.split(","),e.trim);i=n.parseDate(m[0],C.formatDate),s=n.parseDate(m[1],C.formatDate),d=m[2],c=m[3]}for(;i<=s;)u=new t(i,d,c),l=n.formatDate(i,C.formatDate),i.setDate(i.getDate()+1),void 0!==o[l]?(f=o[l].desc)&&f.length&&u.desc&&u.desc.length&&(o[l].desc=f+"\n"+u.desc):o[l]=u}),C.highlightedDates=e.extend(!0,[],o)),r.disabledDates&&e.isArray(r.disabledDates)&&r.disabledDates.length&&(C.disabledDates=e.extend(!0,[],r.disabledDates)),r.disabledWeekDays&&e.isArray(r.disabledWeekDays)&&r.disabledWeekDays.length&&(C.disabledWeekDays=e.extend(!0,[],r.disabledWeekDays)),!C.open&&!C.opened||C.inline||a.trigger("open.xdsoft"),C.inline&&(U=!0,H.addClass("xdsoft_inline"),a.after(H).hide()),C.inverseButton&&(C.next="xdsoft_prev",C.prev="xdsoft_next"),C.datepicker?z.addClass("active"):z.removeClass("active"),C.timepicker?L.addClass("active"):L.removeClass("active"),C.value&&(Y.setCurrentTime(C.value),a&&a.val&&a.val(Y.str)),isNaN(C.dayOfWeekStart)?C.dayOfWeekStart=0:C.dayOfWeekStart=parseInt(C.dayOfWeekStart,10)%7,C.timepickerScrollbar||E.xdsoftScroller(C,"hide"),C.minDate&&/^[\+\-](.*)$/.test(C.minDate)&&(C.minDate=n.formatDate(Y.strToDateTime(C.minDate),C.formatDate)),C.maxDate&&/^[\+\-](.*)$/.test(C.maxDate)&&(C.maxDate=n.formatDate(Y.strToDateTime(C.maxDate),C.formatDate)),C.minDateTime&&/^\+(.*)$/.test(C.minDateTime)&&(C.minDateTime=Y.strToDateTime(C.minDateTime).dateFormat(C.formatDate)),B.toggle(C.showApplyButton),I.find(".xdsoft_today_button").css("visibility",C.todayButton?"visible":"hidden"),I.find("."+C.prev).css("visibility",C.prevButton?"visible":"hidden"),I.find("."+C.next).css("visibility",C.nextButton?"visible":"hidden"),s(C),C.validateOnBlur&&a.off("blur.xdsoft").on("blur.xdsoft",function(){if(C.allowBlank&&(!e.trim(e(this).val()).length||"string"==typeof C.mask&&e.trim(e(this).val())===C.mask.replace(/[0-9]/g,"_")))e(this).val(null),H.data("xdsoft_datetime").empty();else{var t=n.parseDate(e(this).val(),C.format);if(t)e(this).val(n.formatDate(t,C.format));else{var a=+[e(this).val()[0],e(this).val()[1]].join(""),r=+[e(this).val()[2],e(this).val()[3]].join("");!C.datepicker&&C.timepicker&&a>=0&&a<24&&r>=0&&r<60?e(this).val([a,r].map(function(e){return e>9?e:"0"+e}).join(":")):e(this).val(n.formatDate(Y.now(),C.format))}H.data("xdsoft_datetime").setCurrentTime(e(this).val())}H.trigger("changedatetime.xdsoft"),H.trigger("close.xdsoft")}),C.dayOfWeekStartPrev=0===C.dayOfWeekStart?6:C.dayOfWeekStart-1,H.trigger("xchange.xdsoft").trigger("afterOpen.xdsoft")},H.data("options",C).on("touchstart mousedown.xdsoft",function(e){return e.stopPropagation(),e.preventDefault(),G.hide(),V.hide(),!1}),E.append(R),E.xdsoftScroller(C),H.on("afterOpen.xdsoft",function(){E.xdsoftScroller(C)}),H.append(z).append(L),!0!==C.withoutCopyright&&H.append(J),z.append(I).append(N).append(B),e(C.parentID).append(H),Y=new function(){var t=this;t.now=function(e){var a,n,r=new Date;return!e&&C.defaultDate&&(a=t.strToDateTime(C.defaultDate),r.setFullYear(a.getFullYear()),r.setMonth(a.getMonth()),r.setDate(a.getDate())),C.yearOffset&&r.setFullYear(r.getFullYear()+C.yearOffset),!e&&C.defaultTime&&(n=t.strtotime(C.defaultTime),r.setHours(n.getHours()),r.setMinutes(n.getMinutes())),r},t.isValidDate=function(e){return"[object Date]"===Object.prototype.toString.call(e)&&!isNaN(e.getTime())},t.setCurrentTime=function(e,a){"string"==typeof e?t.currentTime=t.strToDateTime(e):t.isValidDate(e)?t.currentTime=e:e||a||!C.allowBlank||C.inline?t.currentTime=t.now():t.currentTime=null,H.trigger("xchange.xdsoft")},t.empty=function(){t.currentTime=null},t.getCurrentTime=function(){return t.currentTime},t.nextMonth=function(){void 0!==t.currentTime&&null!==t.currentTime||(t.currentTime=t.now());var a,n=t.currentTime.getMonth()+1;return 12===n&&(t.currentTime.setFullYear(t.currentTime.getFullYear()+1),n=0),a=t.currentTime.getFullYear(),t.currentTime.setDate(Math.min(new Date(t.currentTime.getFullYear(),n+1,0).getDate(),t.currentTime.getDate())),t.currentTime.setMonth(n),C.onChangeMonth&&e.isFunction(C.onChangeMonth)&&C.onChangeMonth.call(H,Y.currentTime,H.data("input")),a!==t.currentTime.getFullYear()&&e.isFunction(C.onChangeYear)&&C.onChangeYear.call(H,Y.currentTime,H.data("input")),H.trigger("xchange.xdsoft"),n},t.prevMonth=function(){void 0!==t.currentTime&&null!==t.currentTime||(t.currentTime=t.now());var a=t.currentTime.getMonth()-1;return-1===a&&(t.currentTime.setFullYear(t.currentTime.getFullYear()-1),a=11),t.currentTime.setDate(Math.min(new Date(t.currentTime.getFullYear(),a+1,0).getDate(),t.currentTime.getDate())),t.currentTime.setMonth(a),C.onChangeMonth&&e.isFunction(C.onChangeMonth)&&C.onChangeMonth.call(H,Y.currentTime,H.data("input")),H.trigger("xchange.xdsoft"),a},t.getWeekOfYear=function(t){if(C.onGetWeekOfYear&&e.isFunction(C.onGetWeekOfYear)){var a=C.onGetWeekOfYear.call(H,t);if(void 0!==a)return a}var n=new Date(t.getFullYear(),0,1);return 4!==n.getDay()&&n.setMonth(0,1+(4-n.getDay()+7)%7),Math.ceil(((t-n)/864e5+n.getDay()+1)/7)},t.strToDateTime=function(e){var a,r,o=[];return e&&e instanceof Date&&t.isValidDate(e)?e:((o=/^([+-]{1})(.*)$/.exec(e))&&(o[2]=n.parseDate(o[2],C.formatDate)),o&&o[2]?(a=o[2].getTime()-6e4*o[2].getTimezoneOffset(),r=new Date(t.now(!0).getTime()+parseInt(o[1]+"1",10)*a)):r=e?n.parseDate(e,C.format):t.now(),t.isValidDate(r)||(r=t.now()),r)},t.strToDate=function(e){if(e&&e instanceof Date&&t.isValidDate(e))return e;var a=e?n.parseDate(e,C.formatDate):t.now(!0);return t.isValidDate(a)||(a=t.now(!0)),a},t.strtotime=function(e){if(e&&e instanceof Date&&t.isValidDate(e))return e;var a=e?n.parseDate(e,C.formatTime):t.now(!0);return t.isValidDate(a)||(a=t.now(!0)),a},t.str=function(){return n.formatDate(t.currentTime,C.format)},t.currentTime=this.now()},B.on("touchend click",function(e){e.preventDefault(),H.data("changed",!0),Y.setCurrentTime(i()),a.val(Y.str()),H.trigger("close.xdsoft")}),I.find(".xdsoft_today_button").on("touchend mousedown.xdsoft",function(){H.data("changed",!0),Y.setCurrentTime(0,!0),H.trigger("afterOpen.xdsoft")}).on("dblclick.xdsoft",function(){var e,t,n=Y.getCurrentTime();n=new Date(n.getFullYear(),n.getMonth(),n.getDate()),e=Y.strToDate(C.minDate),n<(e=new Date(e.getFullYear(),e.getMonth(),e.getDate()))||(t=Y.strToDate(C.maxDate),n>(t=new Date(t.getFullYear(),t.getMonth(),t.getDate()))||(a.val(Y.str()),a.trigger("change"),H.trigger("close.xdsoft")))}),I.find(".xdsoft_prev,.xdsoft_next").on("touchend mousedown.xdsoft",function(){var t=e(this),a=0,n=!1;!function e(r){t.hasClass(C.next)?Y.nextMonth():t.hasClass(C.prev)&&Y.prevMonth(),C.monthChangeSpinner&&(n||(a=setTimeout(e,r||100)))}(500),e([C.ownerDocument.body,C.contentWindow]).on("touchend mouseup.xdsoft",function t(){clearTimeout(a),n=!0,e([C.ownerDocument.body,C.contentWindow]).off("touchend mouseup.xdsoft",t)})}),L.find(".xdsoft_prev,.xdsoft_next").on("touchend mousedown.xdsoft",function(){var t=e(this),a=0,n=!1,r=110;!function e(o){var i=E[0].clientHeight,s=R[0].offsetHeight,d=Math.abs(parseInt(R.css("marginTop"),10));t.hasClass(C.next)&&s-i-C.timeHeightInTimePicker>=d?R.css("marginTop","-"+(d+C.timeHeightInTimePicker)+"px"):t.hasClass(C.prev)&&d-C.timeHeightInTimePicker>=0&&R.css("marginTop","-"+(d-C.timeHeightInTimePicker)+"px"),E.trigger("scroll_element.xdsoft_scroller",[Math.abs(parseInt(R[0].style.marginTop,10)/(s-i))]),r=r>10?10:r-10,n||(a=setTimeout(e,o||r))}(500),e([C.ownerDocument.body,C.contentWindow]).on("touchend mouseup.xdsoft",function t(){clearTimeout(a),n=!0,e([C.ownerDocument.body,C.contentWindow]).off("touchend mouseup.xdsoft",t)})}),d=0,H.on("xchange.xdsoft",function(t){clearTimeout(d),d=setTimeout(function(){void 0!==Y.currentTime&&null!==Y.currentTime||(Y.currentTime=Y.now());for(var t,i,s,d,u,l,f,c,m,h,g="",p=new Date(Y.currentTime.getFullYear(),Y.currentTime.getMonth(),1,12,0,0),y=0,D=Y.now(),v=!1,b=!1,k=!1,x=[],T=!0,S="";p.getDay()!==C.dayOfWeekStart;)p.setDate(p.getDate()-1);for(g+="<table><thead><tr>",C.weeks&&(g+="<th></th>"),t=0;t<7;t+=1)g+="<th>"+C.i18n[r].dayOfWeekShort[(t+C.dayOfWeekStart)%7]+"</th>";for(g+="</tr></thead>",g+="<tbody>",!1!==C.maxDate&&(v=Y.strToDate(C.maxDate),v=new Date(v.getFullYear(),v.getMonth(),v.getDate(),23,59,59,999)),!1!==C.minDate&&(b=Y.strToDate(C.minDate),b=new Date(b.getFullYear(),b.getMonth(),b.getDate())),!1!==C.minDateTime&&(k=Y.strToDate(C.minDateTime),k=new Date(k.getFullYear(),k.getMonth(),k.getDate(),k.getHours(),k.getMinutes(),k.getSeconds()));y<Y.currentTime.countDaysInMonth()||p.getDay()!==C.dayOfWeekStart||Y.currentTime.getMonth()===p.getMonth();)x=[],y+=1,s=p.getDay(),d=p.getDate(),u=p.getFullYear(),l=p.getMonth(),f=Y.getWeekOfYear(p),h="",x.push("xdsoft_date"),c=C.beforeShowDay&&e.isFunction(C.beforeShowDay.call)?C.beforeShowDay.call(H,p):null,C.allowDateRe&&"[object RegExp]"===Object.prototype.toString.call(C.allowDateRe)?C.allowDateRe.test(n.formatDate(p,C.formatDate))||x.push("xdsoft_disabled"):C.allowDates&&C.allowDates.length>0?-1===C.allowDates.indexOf(n.formatDate(p,C.formatDate))&&x.push("xdsoft_disabled"):!1!==v&&p>v||!1!==k&&p<k||!1!==b&&p<b||c&&!1===c[0]?x.push("xdsoft_disabled"):-1!==C.disabledDates.indexOf(n.formatDate(p,C.formatDate))?x.push("xdsoft_disabled"):-1!==C.disabledWeekDays.indexOf(s)?x.push("xdsoft_disabled"):a.is("[disabled]")&&x.push("xdsoft_disabled"),c&&""!==c[1]&&x.push(c[1]),Y.currentTime.getMonth()!==l&&x.push("xdsoft_other_month"),(C.defaultSelect||H.data("changed"))&&n.formatDate(Y.currentTime,C.formatDate)===n.formatDate(p,C.formatDate)&&x.push("xdsoft_current"),n.formatDate(D,C.formatDate)===n.formatDate(p,C.formatDate)&&x.push("xdsoft_today"),0!==p.getDay()&&6!==p.getDay()&&-1===C.weekends.indexOf(n.formatDate(p,C.formatDate))||x.push("xdsoft_weekend"),void 0!==C.highlightedDates[n.formatDate(p,C.formatDate)]&&(i=C.highlightedDates[n.formatDate(p,C.formatDate)],x.push(void 0===i.style?"xdsoft_highlighted_default":i.style),h=void 0===i.desc?"":i.desc),C.beforeShowDay&&e.isFunction(C.beforeShowDay)&&x.push(C.beforeShowDay(p)),T&&(g+="<tr>",T=!1,C.weeks&&(g+="<th>"+f+"</th>")),g+='<td data-date="'+d+'" data-month="'+l+'" data-year="'+u+'" class="xdsoft_date xdsoft_day_of_week'+p.getDay()+" "+x.join(" ")+'" title="'+h+'"><div>'+d+"</div></td>",p.getDay()===C.dayOfWeekStartPrev&&(g+="</tr>",T=!0),p.setDate(d+1);if(g+="</tbody></table>",N.html(g),I.find(".xdsoft_label span").eq(0).text(C.i18n[r].months[Y.currentTime.getMonth()]),I.find(".xdsoft_label span").eq(1).text(Y.currentTime.getFullYear()),S="","",l="",m=function(t,r){var o,i,s=Y.now(),d=C.allowTimes&&e.isArray(C.allowTimes)&&C.allowTimes.length;s.setHours(t),t=parseInt(s.getHours(),10),s.setMinutes(r),r=parseInt(s.getMinutes(),10),(o=new Date(Y.currentTime)).setHours(t),o.setMinutes(r),x=[],!1!==C.minDateTime&&C.minDateTime>o||!1!==C.maxTime&&Y.strtotime(C.maxTime).getTime()<s.getTime()||!1!==C.minTime&&Y.strtotime(C.minTime).getTime()>s.getTime()?x.push("xdsoft_disabled"):!1!==C.minDateTime&&C.minDateTime>o||!1!==C.disabledMinTime&&s.getTime()>Y.strtotime(C.disabledMinTime).getTime()&&!1!==C.disabledMaxTime&&s.getTime()<Y.strtotime(C.disabledMaxTime).getTime()?x.push("xdsoft_disabled"):a.is("[disabled]")&&x.push("xdsoft_disabled"),(i=new Date(Y.currentTime)).setHours(parseInt(Y.currentTime.getHours(),10)),d||i.setMinutes(Math[C.roundTime](Y.currentTime.getMinutes()/C.step)*C.step),(C.initTime||C.defaultSelect||H.data("changed"))&&i.getHours()===parseInt(t,10)&&(!d&&C.step>59||i.getMinutes()===parseInt(r,10))&&(C.defaultSelect||H.data("changed")?x.push("xdsoft_current"):C.initTime&&x.push("xdsoft_init_time")),parseInt(D.getHours(),10)===parseInt(t,10)&&parseInt(D.getMinutes(),10)===parseInt(r,10)&&x.push("xdsoft_today"),S+='<div class="xdsoft_time '+x.join(" ")+'" data-hour="'+t+'" data-minute="'+r+'">'+n.formatDate(s,C.formatTime)+"</div>"},C.allowTimes&&e.isArray(C.allowTimes)&&C.allowTimes.length)for(y=0;y<C.allowTimes.length;y+=1)m(Y.strtotime(C.allowTimes[y]).getHours(),l=Y.strtotime(C.allowTimes[y]).getMinutes());else for(y=0,t=0;y<(C.hours12?12:24);y+=1)for(t=0;t<60;t+=C.step)m((y<10?"0":"")+y,l=(t<10?Y.now().getMinutes():"")+t);for(R.html(S),o="",y=parseInt(C.yearStart,10)+C.yearOffset;y<=parseInt(C.yearEnd,10)+C.yearOffset;y+=1)o+='<div class="xdsoft_option '+(Y.currentTime.getFullYear()===y?"xdsoft_current":"")+'" data-value="'+y+'">'+y+"</div>";for(G.children().eq(0).html(o),y=parseInt(C.monthStart,10),o="";y<=parseInt(C.monthEnd,10);y+=1)o+='<div class="xdsoft_option '+(Y.currentTime.getMonth()===y?"xdsoft_current":"")+'" data-value="'+y+'">'+C.i18n[r].months[y]+"</div>";V.children().eq(0).html(o),e(H).trigger("generate.xdsoft")},10),t.stopPropagation()}).on("afterOpen.xdsoft",function(){if(C.timepicker){var e,t,a,n;R.find(".xdsoft_current").length?e=".xdsoft_current":R.find(".xdsoft_init_time").length&&(e=".xdsoft_init_time"),e?(t=E[0].clientHeight,(a=R[0].offsetHeight)-t<(n=R.find(e).index()*C.timeHeightInTimePicker+1)&&(n=a-t),E.trigger("scroll_element.xdsoft_scroller",[parseInt(n,10)/(a-t)])):E.trigger("scroll_element.xdsoft_scroller",[0])}}),u=0,N.on("touchend click.xdsoft","td",function(t){t.stopPropagation(),u+=1;var n=e(this),r=Y.currentTime;if(void 0!==r&&null!==r||(Y.currentTime=Y.now(),r=Y.currentTime),n.hasClass("xdsoft_disabled"))return!1;r.setDate(1),r.setFullYear(n.data("year")),r.setMonth(n.data("month")),r.setDate(n.data("date")),H.trigger("select.xdsoft",[r]),a.val(Y.str()),C.onSelectDate&&e.isFunction(C.onSelectDate)&&C.onSelectDate.call(H,Y.currentTime,H.data("input"),t),H.data("changed",!0),H.trigger("xchange.xdsoft"),H.trigger("changedatetime.xdsoft"),(u>1||!0===C.closeOnDateSelect||!1===C.closeOnDateSelect&&!C.timepicker)&&!C.inline&&H.trigger("close.xdsoft"),setTimeout(function(){u=0},200)}),R.on("touchend click.xdsoft","div",function(t){t.stopPropagation();var a=e(this),n=Y.currentTime;if(void 0!==n&&null!==n||(Y.currentTime=Y.now(),n=Y.currentTime),a.hasClass("xdsoft_disabled"))return!1;n.setHours(a.data("hour")),n.setMinutes(a.data("minute")),H.trigger("select.xdsoft",[n]),H.data("input").val(Y.str()),C.onSelectTime&&e.isFunction(C.onSelectTime)&&C.onSelectTime.call(H,Y.currentTime,H.data("input"),t),H.data("changed",!0),H.trigger("xchange.xdsoft"),H.trigger("changedatetime.xdsoft"),!0!==C.inline&&!0===C.closeOnTimeSelect&&H.trigger("close.xdsoft")}),z.on("mousewheel.xdsoft",function(e){return!C.scrollMonth||(e.deltaY<0?Y.nextMonth():Y.prevMonth(),!1)}),a.on("mousewheel.xdsoft",function(e){return!C.scrollInput||(!C.datepicker&&C.timepicker?((P=R.find(".xdsoft_current").length?R.find(".xdsoft_current").eq(0).index():0)+e.deltaY>=0&&P+e.deltaY<R.children().length&&(P+=e.deltaY),R.children().eq(P).length&&R.children().eq(P).trigger("mousedown"),!1):C.datepicker&&!C.timepicker?(z.trigger(e,[e.deltaY,e.deltaX,e.deltaY]),a.val&&a.val(Y.str()),H.trigger("changedatetime.xdsoft"),!1):void 0)}),H.on("changedatetime.xdsoft",function(t){if(C.onChangeDateTime&&e.isFunction(C.onChangeDateTime)){var a=H.data("input");C.onChangeDateTime.call(H,Y.currentTime,a,t),delete C.value,a.trigger("change")}}).on("generate.xdsoft",function(){C.onGenerate&&e.isFunction(C.onGenerate)&&C.onGenerate.call(H,Y.currentTime,H.data("input")),U&&(H.trigger("afterOpen.xdsoft"),U=!1)}).on("click.xdsoft",function(e){e.stopPropagation()}),P=0,j=function(e,t){do{if(!(e=e.parentNode)||!1===t(e))break}while("HTML"!==e.nodeName)},A=function(){var t,a,n,r,o,i,s,d,u,l,f,c,m;if(d=H.data("input"),t=d.offset(),a=d[0],l="top",n=t.top+a.offsetHeight-1,r=t.left,o="absolute",u=e(C.contentWindow).width(),c=e(C.contentWindow).height(),m=e(C.contentWindow).scrollTop(),C.ownerDocument.documentElement.clientWidth-t.left<z.parent().outerWidth(!0)){var h=z.parent().outerWidth(!0)-a.offsetWidth;r-=h}"rtl"===d.parent().css("direction")&&(r-=H.outerWidth()-d.outerWidth()),C.fixed?(n-=m,r-=e(C.contentWindow).scrollLeft(),o="fixed"):(s=!1,j(a,function(e){return null!==e&&("fixed"===C.contentWindow.getComputedStyle(e).getPropertyValue("position")?(s=!0,!1):void 0)}),s?(o="fixed",n+H.outerHeight()>c+m?(l="bottom",n=c+m-t.top):n-=m):n+H[0].offsetHeight>c+m&&(n=t.top-H[0].offsetHeight+1),n<0&&(n=0),r+a.offsetWidth>u&&(r=u-a.offsetWidth)),i=H[0],j(i,function(e){if("relative"===C.contentWindow.getComputedStyle(e).getPropertyValue("position")&&u>=e.offsetWidth)return r-=(u-e.offsetWidth)/2,!1}),(f={position:o,left:r,top:"",bottom:""})[l]=n,H.css(f)},H.on("open.xdsoft",function(t){var a=!0;C.onShow&&e.isFunction(C.onShow)&&(a=C.onShow.call(H,Y.currentTime,H.data("input"),t)),!1!==a&&(H.show(),A(),e(C.contentWindow).off("resize.xdsoft",A).on("resize.xdsoft",A),C.closeOnWithoutClick&&e([C.ownerDocument.body,C.contentWindow]).on("touchstart mousedown.xdsoft",function t(){H.trigger("close.xdsoft"),e([C.ownerDocument.body,C.contentWindow]).off("touchstart mousedown.xdsoft",t)}))}).on("close.xdsoft",function(t){var a=!0;I.find(".xdsoft_month,.xdsoft_year").find(".xdsoft_select").hide(),C.onClose&&e.isFunction(C.onClose)&&(a=C.onClose.call(H,Y.currentTime,H.data("input"),t)),!1===a||C.opened||C.inline||H.hide(),t.stopPropagation()}).on("toggle.xdsoft",function(){H.is(":visible")?H.trigger("close.xdsoft"):H.trigger("open.xdsoft")}).data("input",a),q=0,H.data("xdsoft_datetime",Y),H.setOptions(C),Y.setCurrentTime(i()),a.data("xdsoft_datetimepicker",H).on("open.xdsoft focusin.xdsoft mousedown.xdsoft touchstart",function(){a.is(":disabled")||a.data("xdsoft_datetimepicker").is(":visible")&&C.closeOnInputClick||(clearTimeout(q),q=setTimeout(function(){a.is(":disabled")||(U=!0,Y.setCurrentTime(i(),!0),C.mask&&s(C),H.trigger("open.xdsoft"))},100))}).on("keydown.xdsoft",function(t){var a,n=t.which;return-1!==[p].indexOf(n)&&C.enterLikeTab?(a=e("input:visible,textarea:visible,button:visible,a:visible"),H.trigger("close.xdsoft"),a.eq(a.index(this)+1).focus(),!1):-1!==[T].indexOf(n)?(H.trigger("close.xdsoft"),!0):void 0}).on("blur.xdsoft",function(){H.trigger("close.xdsoft")})},d=function(t){var a=t.data("xdsoft_datetimepicker");a&&(a.data("xdsoft_datetime",null),a.remove(),t.data("xdsoft_datetimepicker",null).off(".xdsoft"),e(C.contentWindow).off("resize.xdsoft"),e([C.contentWindow,C.ownerDocument.body]).off("mousedown.xdsoft touchstart"),t.unmousewheel&&t.unmousewheel())},e(C.ownerDocument).off("keydown.xdsoftctrl keyup.xdsoftctrl").on("keydown.xdsoftctrl",function(e){e.keyCode===h&&(F=!0)}).on("keyup.xdsoftctrl",function(e){e.keyCode===h&&(F=!1)}),this.each(function(){var t=e(this).data("xdsoft_datetimepicker");if(t){if("string"===e.type(o))switch(o){case"show":e(this).select().focus(),t.trigger("open.xdsoft");break;case"hide":t.trigger("close.xdsoft");break;case"toggle":t.trigger("toggle.xdsoft");break;case"destroy":d(e(this));break;case"reset":this.value=this.defaultValue,this.value&&t.data("xdsoft_datetime").isValidDate(n.parseDate(this.value,C.format))||t.data("changed",!1),t.data("xdsoft_datetime").setCurrentTime(this.value);break;case"validate":t.data("input").trigger("blur.xdsoft");break;default:t[o]&&e.isFunction(t[o])&&(u=t[o](i))}else t.setOptions(o);return 0}"string"!==e.type(o)&&(!C.lazyInit||C.open||C.inline?s(e(this)):A(e(this)))}),u},e.fn.datetimepicker.defaults=a};!function(e){"function"==typeof define&&define.amd?define(["jquery","jquery-mousewheel"],e):"object"==typeof exports?module.exports=e(require("jquery")):e(jQuery)}(datetimepickerFactory),function(e){"function"==typeof define&&define.amd?define(["jquery"],e):"object"==typeof exports?module.exports=e:e(jQuery)}(function(e){function t(t){var i=t||window.event,s=d.call(arguments,1),u=0,f=0,c=0,m=0,h=0,g=0;if(t=e.event.fix(i),t.type="mousewheel","detail"in i&&(c=-1*i.detail),"wheelDelta"in i&&(c=i.wheelDelta),"wheelDeltaY"in i&&(c=i.wheelDeltaY),"wheelDeltaX"in i&&(f=-1*i.wheelDeltaX),"axis"in i&&i.axis===i.HORIZONTAL_AXIS&&(f=-1*c,c=0),u=0===c?f:c,"deltaY"in i&&(u=c=-1*i.deltaY),"deltaX"in i&&(f=i.deltaX,0===c&&(u=-1*f)),0!==c||0!==f){if(1===i.deltaMode){var p=e.data(this,"mousewheel-line-height");u*=p,c*=p,f*=p}else if(2===i.deltaMode){var y=e.data(this,"mousewheel-page-height");u*=y,c*=y,f*=y}if(m=Math.max(Math.abs(c),Math.abs(f)),(!o||m<o)&&(o=m,n(i,m)&&(o/=40)),n(i,m)&&(u/=40,f/=40,c/=40),u=Math[u>=1?"floor":"ceil"](u/o),f=Math[f>=1?"floor":"ceil"](f/o),c=Math[c>=1?"floor":"ceil"](c/o),l.settings.normalizeOffset&&this.getBoundingClientRect){var D=this.getBoundingClientRect();h=t.clientX-D.left,g=t.clientY-D.top}return t.deltaX=f,t.deltaY=c,t.deltaFactor=o,t.offsetX=h,t.offsetY=g,t.deltaMode=0,s.unshift(t,u,f,c),r&&clearTimeout(r),r=setTimeout(a,200),(e.event.dispatch||e.event.handle).apply(this,s)}}function a(){o=null}function n(e,t){return l.settings.adjustOldDeltas&&"mousewheel"===e.type&&t%120==0}var r,o,i=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],s="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],d=Array.prototype.slice;if(e.event.fixHooks)for(var u=i.length;u;)e.event.fixHooks[i[--u]]=e.event.mouseHooks;var l=e.event.special.mousewheel={version:"3.1.12",setup:function(){if(this.addEventListener)for(var a=s.length;a;)this.addEventListener(s[--a],t,!1);else this.onmousewheel=t;e.data(this,"mousewheel-line-height",l.getLineHeight(this)),e.data(this,"mousewheel-page-height",l.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var a=s.length;a;)this.removeEventListener(s[--a],t,!1);else this.onmousewheel=null;e.removeData(this,"mousewheel-line-height"),e.removeData(this,"mousewheel-page-height")},getLineHeight:function(t){var a=e(t),n=a["offsetParent"in e.fn?"offsetParent":"parent"]();return n.length||(n=e("body")),parseInt(n.css("fontSize"),10)||parseInt(a.css("fontSize"),10)||16},getPageHeight:function(t){return e(t).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})});
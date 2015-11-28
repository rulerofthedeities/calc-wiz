'use strict';

angular.module('km.translate', [])

.constant({
	'version' : '1.0.0',
	'DEFAULTS': {
		'LAN': 'en',
		'CASE': 'nom',
		'FILE': 'json/translations.json',
		'FORMATS': ['lan', "term"],
		'FORMAT': 'lan'
	}
})

.service('kmTranslateFile', ['$http', '$log', 'kmTranslateConfig', function ($http, $log, kmTranslateConfig){
	var translationTableFromFile,
		promise,
		fileName;

	return {
		promise: function(){
			if (promise){
				return promise;
			} else {
				fileName = kmTranslateConfig.getTranslationFileName();
				promise = $http.get(fileName).then(
					function (response) {
						if (response){
							$log.info("Fetched translation data from '" + fileName + "'");
							translationTableFromFile = response.data;
						}
					},
					function(response){
						$log.error("File '" + fileName + "' not found.");
					}
				);
				return promise;
			}
		},
		getTranslationTable: function () {
			return translationTableFromFile;
		}
	};
}])

.provider('kmTranslateConfig', ['DEFAULTS', function(DEFAULTS) {
	var lan = DEFAULTS.LAN,
		translationFile = DEFAULTS.FILE,
		formatType = DEFAULTS.FORMAT,
		translationTableFromObject = null;

	return {
		configSetCurrentLanguage: function(newLan) {
			lan = newLan;
		},
		configSetTranslationFile: function(newFileName, format){
			translationFile = newFileName;
			if(!~DEFAULTS.FORMATS.indexOf(format)){
				format = DEFAULTS.FORMAT;
			}
			formatType = format;
		},
		configSetTranslationTable: function (newTranslationTable) {
			translationTableFromObject = newTranslationTable;
		},

	    $get: function() {
	        return {
	            getCurrentLanguage: function() {
	                return lan;
	            },
	            setCurrentLanguage: function(newLan){
	            	lan = newLan || lan || DEFAULTS.LAN;
	            },
				getTranslationFileName: function(){
					return translationFile || DEFAULTS.FILE;
				},
				getFileFormat: function(){
					return formatType;
				},
				getTranslationTable: function () {
					return translationTableFromObject;
				}
	    	};
		}
	};

}])

.factory('kmTranslate', ['DEFAULTS', 'kmTranslateConfig', 'kmTranslateFile', function(DEFAULTS, kmTranslateConfig, kmTranslateFile){
	return {
		_insert: function(srcStr, toInsert){
			var resultStr = srcStr;
			if (toInsert.constructor === Array){
				for (var i = 0, find; i < toInsert.length; i++){
					find = new RegExp('\%i' + (i + 1));
					resultStr = resultStr.replace(find, toInsert[i]);
				}
				for (i = 0; i < toInsert.length; i++){
					resultStr = resultStr.replace(/\%s/, toInsert[i]);
				}
			} else {
				resultStr = srcStr.replace(/\%s/g, toInsert);
			}
			return resultStr;
		},
		translate: function(strToTranslate, options){
			var lan = kmTranslateConfig.getCurrentLanguage(),
				translation = strToTranslate,
				cas,
				translateTable = kmTranslateFile.getTranslationTable() || kmTranslateConfig.getTranslationTable(), //table loaded from file or from object
				format;//array indices depend on the format of the JSON source

			options = options || {};
			strToTranslate = options.alias || strToTranslate;
			format = kmTranslateConfig.getFileFormat() === "term" ? [strToTranslate, lan] : [lan, strToTranslate];
			cas = options['case'];

			if (translateTable && translateTable[format[0]] && translateTable[format[0]][format[1]]){
				if (cas && translateTable[format[0]][format[1]][cas]){
					//Case is requested and found
					translation = translateTable[format[0]][format[1]][cas];
				} else {
					//Case is not requested but found, so fetch default case (nominative)
					if (translateTable[format[0]][format[1]][DEFAULTS.CASE]){
						translation = translateTable[format[0]][format[1]][DEFAULTS.CASE];
					} else {
						translation = translateTable[format[0]][format[1]];
					}
				}
			} else {
				// No translation found, return null if an alias was given
				if (options.alias){
					translation = null;
				}
			}
			//Check if there are strings to be inserted
			if ((/\%s/.test(translation) ||  (/\%i\d/.test(translation))) && options.insert){
				translation = this._insert(translation, options.insert);
				return translation;
			} else {
				return translation;
			}
		}
	};
}])

.filter('translate', ['kmTranslate', function(kmTranslate){
	return function(input, options){
		var translation = kmTranslate.translate(input, options);
		if (translation){
			return translation;
		} else {
			return input;
		}
	};
}])

.directive('translate', ['kmTranslate', '$compile', function(kmTranslate, $compile){
	return {
		compile: function(scope, element, attributes){
			return {
				post: function postLink(scope, iElement, iAttrs, controller) {
					var params = iAttrs.translate,
						attrToTranslate,
						toTranslate;

					if (params){
						if (params === "content"){
							iElement.html(kmTranslate.translate(iElement.text()));
						}
						else {
							var input = JSON.parse(params.replace(/\'/g, '"'));
							attrToTranslate = input.attr;
							toTranslate = iAttrs[attrToTranslate];
							iAttrs.$set(attrToTranslate, kmTranslate.translate(toTranslate));
							iAttrs.$set("translate", ""); //To prevent looping

							$compile(iElement)(scope);
						}
					}
				}
			};
		}
	};
}]);

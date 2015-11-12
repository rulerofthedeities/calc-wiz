angular.module('km.translate', [])

.constant(
	'DEFAULTS', {
		'LAN': 'en', 
		'CASE': 'nom', 
		'FILE': 'json/translations.json',
		'FORMATS': ['lan', "term"],
		'FORMAT': 'lan'
	}
)

.service('kmts', ['$http', '$log', 'kmtp', function ($http, $log, kmtp){
	var translationTable,
		promise,
		fileName;

	fileName = kmtp.getTranslationFile();
	promise = $http.get(fileName);

	return {
		promise: promise.then(
			function (response) {
				$log.info("Fetched translation data from '" + fileName + "'");
				translationTable = response.data;
			},
			function(response){
				$log.error("File '" + fileName + "' not found.");
			}
		),
		getTranslationTable: function () {
			return translationTable;
		}
	};
}])

.provider('kmtp', ['DEFAULTS', function(DEFAULTS) {
	var lan = DEFAULTS.LAN,
		translationFile = DEFAULTS.FILE,
		formatType = DEFAULTS.FORMAT;

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

	    $get: function() {
	        return {
	            getCurrentLanguage: function() {
	                return lan;
	            },
	            setCurrentLanguage: function(newLan){
	            	lan = newLan || lan || DEFAULTS.LAN;
	            },
				insert: function(srcStr, toInsert){
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
				getTranslationFile: function(){
					return translationFile || DEFAULTS.FILE;
				},
				getFileFormat: function(){
					return formatType;
				},
	        };
		}
	};

}])

.factory('translate', ['DEFAULTS', 'kmtp', 'kmts', function(DEFAULTS, kmtp, kmts){
	return {
		translate: function(strToTranslate, options){
			var lan = kmtp.getCurrentLanguage(),
				translation = strToTranslate,
				cas,
				translateTable = kmts.getTranslationTable(),
				format;//array indices depend on the format of the JSON source 
				
			options = options || {};
			strToTranslate = options.alias || strToTranslate;
			format = kmtp.getFileFormat() === "term" ? [strToTranslate, lan] : [lan, strToTranslate];
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
				translation = kmtp.insert(translation, options.insert);
				return translation;
			} else {
				return translation;
			}
		}
	};
}])

.filter('translate', ['translate', function(translate){
	return function(input){
		var translation = translate.translate(input);
		if (translation){
			return translation;
		} else {
			return input;
		}
	};
}])

.directive('translate', ['translate', '$compile', function(translate, $compile){
	return {
		compile: function(scope, element, attributes){
			return {
				post: function postLink(scope, iElement, iAttrs, controller) {
					var params = iAttrs.translate,
						attrToTranslate,
						toTranslate;

					if (params){
						if (params === "content"){
							iElement.html(translate.translate(iElement.text()));
						}
						else {
							input = JSON.parse(params.replace(/\'/g, '"'));
							attrToTranslate = input.attr;
							toTranslate = iAttrs[attrToTranslate];
							iAttrs.$set(attrToTranslate, translate.translate(toTranslate));
							iAttrs.$set("translate", ""); //To prevent looping

							$compile(iElement)(scope);
						}
					}
				}
			};
		}
	};
}]);


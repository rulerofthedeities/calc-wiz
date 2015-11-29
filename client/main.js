var kmCalc = angular.module("kmCalc", [
	'ngRoute', 
	'ui.bootstrap', 
	'km.translate', 
	'mediaPlayer', 
	'ngAnimate']);

kmCalc
.constant("DEFAULTS",{	
	'templateDir': 'views/directives/',
	'languages': [
		{'code': 'en', 'name':'English'}, 
		{'code': 'nl', 'name': 'Nederlands'}
		]
})

.run(function(user){
	user.load().then(function(userData){
		if (userData){
			userData = JSON.parse(userData);
			user.login(userData);
		}
	});
});

//Load json files and bootstrap
angular.element(document).ready(function () {
	var initInjector = angular.injector(['ng']),
		$http = initInjector.get('$http'),
		$log = initInjector.get('$log'),
		jsonDir = "json/",
		configFileName = "config.json",
		translateFileName = "translate.json",
		promise = $http.get(jsonDir + configFileName);

	promise.then(
		function(configResponse){
			$log.info("Configuration file '" + jsonDir + configFileName + "' loaded");

			angular.module('kmCalc')
				.value('settings', configResponse.data)
				.value("configFileName", configFileName)
				.config(['kmTranslateConfigProvider', function(kmTranslateConfigProvider){
					kmTranslateConfigProvider.configSetCurrentLanguage(configResponse.data.general.language);
					kmTranslateConfigProvider.configSetTranslationFile("json/translate.json", "lan");
				}]);
				angular.bootstrap(document, ['kmCalc'], true);
		},
		function(){
			$log.error("Error loading configuration file '" + jsonDir + configFileName + "'");
		}
	);
});


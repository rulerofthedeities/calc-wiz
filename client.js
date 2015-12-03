var kmCalc = angular.module("kmCalc", [
	'ngRoute', 
	'ui.bootstrap', 
	'km.translate', 
	'mediaPlayer', 
	'ngAnimate']);

kmCalc.constant("DEFAULTS",{	
	'templateDir': 'views/directives/',
	'languages': [
		{'code': 'en', 'name':'English'}, 
		{'code': 'nl', 'name': 'Nederlands'}
		]
});

//Load json files and bootstrap
angular.element(document).ready(function () {
	var initInjector = angular.injector(['ng']),
		$http = initInjector.get('$http'),
		$log = initInjector.get('$log'),
		defaultUser = {"name": "demo"},
		userKey = 'calc-wiz-user',
		translateFileName = "json/translate.json",
		promise = $http.get(translateFileName);

	/** Loading Sequence
		1. Load translation file.
		2. Check if a local username is saved in local storage.
		3. If not, use default user ('demo')
		4. Load config settings for that user from db
		5. If db entry does not exist , the default config file will be loaded (backend)
	**/

	promise.then(
		function(translateResponse){
			$log.info("Translation file '" + translateFileName + "' loaded");
			var userData = localStorage.getItem(userKey);
			userData = JSON.parse(userData) || defaultUser;
			
			$http.get('/config?usr=' + encodeURI(userData.name)).then(function(configResponse){
				angular.module('kmCalc')
					.config(['configProvider', function(configProvider){
						configProvider.configSetSettings(configResponse.data);
					}])
					.config(['userProvider', function(userProvider){
						userProvider.configSetUser(userData);
					}])
					.config(['kmTranslateConfigProvider', function(kmTranslateConfigProvider){
						kmTranslateConfigProvider.configSetCurrentLanguage(configResponse.data.general.language);
						kmTranslateConfigProvider.configSetTranslationFile(translateFileName, "lan");
					}]);
				angular.bootstrap(document, ['kmCalc'], true);
			});
		},
		function(){
			$log.error("Error loading translation file '" + translateFileName + "'");
		}
	);
});


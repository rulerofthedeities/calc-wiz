(function(ng, app){
	
	"use strict";

	app
	.config(function($routeProvider){
		/*
		var translationResolve = ['kmTranslateFile', 
			function(kmTranslateFile){
				return kmTranslateFile.promise(); 
		}],
		customRouteProvider = angular.extend({}, $routeProvider, {
			when: function(path, route) {
				route.resolve = (route.resolve) ? route.resolve : {};
				angular.extend(route.resolve, translationResolve);
				$routeProvider.when(path, route);
				this.$inject = ['path', 'route'];
				return this;
			}
		});
*/

		$routeProvider.when('/', {
			templateUrl: 'views/menu.htm' 
		}).when('/exercises/:type', {
			templateUrl: 'views/exercises.htm',
			controller:'exercisesCtrl'
		}).when('/results', {
			templateUrl: 'views/results.htm'
		}).when('/config', {
			templateUrl: 'views/configuration.htm'
		}).otherwise({redirectTo: '/'});
	});

})(angular, kmCalc);
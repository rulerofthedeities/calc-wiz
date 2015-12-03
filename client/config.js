(function(ng, app){
	
	"use strict";

	app
	.config(function($routeProvider){

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
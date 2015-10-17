angular.module("calc", ['ngRoute'])

.config(function($routeProvider){
	$routeProvider.when('/menu', {
		templateUrl: 'views/menu.htm'
	}).when('/arithmetics', {
		templateUrl: 'views/arithmetics.htm'
	}).otherwise({redirectTo: '/menu'});
})

.directive("menu", function(){
	return{
		restrict: 'E',
		templateUrl: 'directives/menu.htm'
	};
});
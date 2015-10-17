angular.module("calc", ['ngRoute', 'ui.bootstrap'])

.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: 'views/menu.htm'
	}).when('/arithmetics', {
		templateUrl: 'views/arithmetics.htm'
	}).otherwise({redirectTo: '/'});
})

.directive("calcMenu", function(){
	return{
		restrict: 'E',
		templateUrl: 'directives/menu.htm'
	};
})

.directive("calcHeader", function(){
	return{
		restrict: 'E',
		templateUrl: 'directives/header.htm',
		scope: {title:'@'},
		controller: function($scope){
			$scope.isCollapsed = true;
		}
	};
});
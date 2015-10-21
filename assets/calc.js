angular.module("calc", ['ngRoute', 'ui.bootstrap'])

.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: 'views/menu.htm'
	}).when('/addition', {
		templateUrl: 'views/addition.htm'
	}).otherwise({redirectTo: '/'});
})

.directive("calcMenu", function(){
	return{
		restrict: 'E',
		templateUrl: 'directives/menu.htm',
		controller: function($scope){
			$scope.isMenuCollapsed = true;
		}
	};
})

.directive("calcHeader", function(){
	return{
		restrict: 'E',
		templateUrl: 'directives/header.htm',
		scope: {title:'@'},
		controller: function($scope){
			$scope.isHeaderCollapsed = true;
		}
	};
})

.directive("calcExercise", function(){
	return {
		restrict: 'E',
		templateUrl: 'directives/exercise.htm',
		scope: {type:'@'},
		controller: function($scope){
			$scope.nr = 1;
			$scope.maxNr = 10;
			$scope.question = Questions.getQuestion($scope.type);
			$scope.clearField = function(fieldName){
				$scope[fieldName] = "";
				$scope.setFocus = true;
			};
			$scope.setCursor = function($event) {
				var element = $event.target;
				if(element.setSelectionRange){
					element.setSelectionRange(0, 0, "backward");
		    	}
			};
			$scope.submitAnswer = function(answer){

				if (parseInt(answer,10) === $scope.question.answer){
					console.log("correct");
					$scope.question = Questions.nextQuestion($scope);
					$scope.setFocus = true;
				} else {
					console.log("incorrect");
				}
			};
		}
	};
})

.directive('autoFocus', function($timeout) {
    return {
        restrict: 'AC',
        link: function(scope, element, attr) {
        	scope.$watch('setFocus', function() {
				element[0].focus();
				scope.setFocus= false;
			});
        }
    };
});



var Config = {
	range:{addition: {min: 101, max: 9999}},
	operator:{
		addition: {label:'+', operator:'+'},
		subtraction: {label:'-', operator:'-'},
		division: {label: '&#xf7;', operator: '/'},
		multiplication: {label:'x', operator:'*'}
	}
},
Questions = {
	getQuestion: function(tpe){
		var range = Config.range[tpe],
			term1 = Utils.getRandomInt(range.min, range.max),
			term2 = Utils.getRandomInt(range.min, range.max),
			len = Math.max(term1.toString().length, term2.toString().length);

		return {
			terms: {
				1: Utils.pad(term1, " ", len), 
				2: Utils.pad(term2, " ", len)
			},
			operator: Config.operator[tpe].label,
			len: len,
			answer: eval(term1 + Config.operator[tpe].operator + term2)
		};
	},
	nextQuestion: function(scope){
		scope.nr++;
		scope.answer = "";
		return Questions.getQuestion(scope.type);
	}
},
Utils = {
	getRandomInt: function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	pad: function(str, padding, len){
		str = Array(len + 1).join(padding) + str;
		return (str.slice(-len));
	}
},
UI = {
};
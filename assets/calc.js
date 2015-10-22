angular.module("calc", ['ngRoute', 'ui.bootstrap'])

.value("settings", {
	range:{addition: {min: 101, max: 9999}},
	operator:{
		addition: {label:'+', operator:'+'},
		subtraction: {label:'-', operator:'-'},
		division: {label: '&#xf7;', operator: '/'},
		multiplication: {label:'x', operator:'*'}
	},
	btnMessage: {active: "Submit Answer", inActive: "Next Question"}
})

.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: 'views/menu.htm'
	}).when('/addition', {
		templateUrl: 'views/addition.htm'
	}).otherwise({redirectTo: '/'});
})

.factory("utils", function(){
	return {
		getRandomInt : function(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		pad: function(str, padding, len){
			str = Array(len + 1).join(padding) + str;
			return (str.slice(-len));
		}
	};
})

.factory("questions", function(settings, utils){
	return {
		getQuestion: function(tpe){
			var range = settings.range[tpe],
			term1 = utils.getRandomInt(range.min, range.max),
			term2 = utils.getRandomInt(range.min, range.max),
			len = Math.max(term1.toString().length, term2.toString().length);

			return {
				terms: {
					1: utils.pad(term1, " ", len), 
					2: utils.pad(term2, " ", len)
				},
				operator: settings.operator[tpe].label,
				len: len,
				answer: eval(term1 + settings.operator[tpe].operator + term2)
			};
		}
	};
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
		controller: function($scope, questions, settings){
			$scope.nr = 1;
			$scope.maxNr = 10;
			$scope.correct = [];
			$scope.isWrongAnswer = false;
			$scope.btnMessage = settings.btnMessage.active;
			$scope.question = questions.getQuestion($scope.type);
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
				if ($scope.isWrongAnswer){
					$scope.nextQuestion();
				} else {
					if (parseInt(answer, 10) === $scope.question.answer){
						console.log("correct");
						$scope.correct[$scope.nr - 1] = true;
						$scope.nextQuestion();
					} else {
						console.log("incorrect");
						$scope.correct[$scope.nr - 1] = false;
						$scope.isWrongAnswer = true;
						$scope.btnMessage = settings.btnMessage.inActive;
					}
					$scope.nr++;
				}
			};
			$scope.nextQuestion = function(){
				$scope.isWrongAnswer = false;
				$scope.btnMessage = settings.btnMessage.active;
				$scope.question = questions.getQuestion($scope.type);
				$scope.answer = "";
				$scope.setFocus = true;
			};
		}
	};
})

.directive('autoFocus', function() {
    return {
        restrict: 'AC',
        link: function(scope, element, attr) {
        	scope.$watch('setFocus', function() {
				element[0].focus();
				scope.setFocus = false;
			});
        }
    };
})

.directive('exerciseProgress', function() {
    return {
        restrict: 'E',
        templateUrl: 'directives/progress.htm'
    };
});


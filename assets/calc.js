angular.module("calc", ['ngRoute', 'ui.bootstrap'])

.value("settings", {
	nrOfQuestions: 5,
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

.service("results", function(){
	this.init = function(){
		this.results = {questions:[]};
	};
	this.addResult = function(question, correct, nr){
		var result = {
			nr: nr + 1,
			question: question, 
			answer: question.useranswer,
			correct: correct
		};
		this.results.questions.push(result);
	};
	this._processResults = function(){
		for(var indx = 0, countCorrect = 0; indx < this.results.questions.length; indx++){
			if(this.results.questions[indx].correct) {
				countCorrect++;
			}
		}
		this.results.totals = {
			nrOfQuestions: this.results.questions.length,
			correct: countCorrect,
			percentage: countCorrect / this.results.questions.length * 100
		};
	};
	this.getResults = function(){
		this._processResults();
		return this.results;
	};
})

.directive("calcMenu", function(){
	return{
		restrict: 'E',
		replace: true,
		templateUrl: 'directives/menu.htm',
		controller: function($scope){
			$scope.isMenuCollapsed = true;
		}
	};
})

.directive("calcHeader", function(){
	return{
		restrict: 'E',
		replace: true,
		templateUrl: 'directives/header.htm',
		scope: {title:'@'},
		controller: function($scope){
			$scope.isHeaderCollapsed = true;
		}
	};
})

.directive("panelView", function(){
	return{
		restrict: 'A',
		controller: function($scope){ 
			$scope.subview = "question";
			$scope.changeView = function(newView){
				$scope.subview = newView;
			};
		}
	};
})

.directive("calcExercise", function(){
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'directives/exercise.htm',
		scope: {type:'@'},
    	bindToController: true,
    	controllerAs: 'ctrl',
		controller: function(settings, questions, results){
			results.init();
			this.nr = 1;
			this.subview = "question";
			this.maxNr = settings.nrOfQuestions;
			this.correct = [];
			this.isWrongAnswer = false;
			this.btnMessage = settings.btnMessage.active;
			this.question = questions.getQuestion(this.type);
			this.clearField = function(fieldName){
				this.question[fieldName] = "";
				this.setFocus = true;
				$scope.setFocus = true;
			};
			this.setCursor = function($event) {
				var element = $event.target;
				if(element.setSelectionRange){
					element.setSelectionRange(0, 0, "backward");
		    	}
			};
			this.submitAnswer = function(answer){
				if (this.isWrongAnswer){
					this.nextQuestion();
				} else {
					this.question.nr = this.nr;
					if (parseInt(this.question.useranswer, 10) === this.question.answer){
						results.addResult(this.question, true, this.nr);
						this.correct[this.nr - 1] = true;
						this.nextQuestion();
					} else {
						results.addResult(this.question, false, this.nr);
						this.correct[this.nr - 1] = false;
						this.isWrongAnswer = true;
						this.btnMessage = settings.btnMessage.inActive;
					}
				}
			};
			this.nextQuestion = function(){
				if (this.nr < settings.nrOfQuestions){
					this.isWrongAnswer = false;
					this.btnMessage = settings.btnMessage.active;
					this.question.useranswer = "";
					this.setFocus = true;
					this.question = questions.getQuestion(this.type);
					this.nr++;
				} else {
					this.results = results.getResults();
					this.subview = "results";
				}
			};
		}
	};
})

.directive('autoFocus', function() {
    return {
        restrict: 'AC',
        scope: {setFocus:'=setfocus'},
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
        replace: true,
        scope: {correct:'='},
        templateUrl: 'directives/progress.htm'
    };
})

.directive('exerciseResults', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {results:'='}, 
        templateUrl: 'directives/result.htm'
    };
});


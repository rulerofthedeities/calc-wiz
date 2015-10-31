angular.module("calc", ['ngRoute', 'ui.bootstrap'])

.value("settings", {
	nrOfQuestions: 5,
	range:{
		addition: {
			t1: {min: 101, max: 9999},
			t2: {min: 101, max: 9999},
			result: {min: 200, max: 9999}
		},
		subtraction: {
			t1: {min: 102, max: 9999},
			t2: {min: 101, max: 9999},
			result: {min: 1, max: 9000}
		},
		multiplication: {
			t1: {min: 101, max: 9999},
			t2: {min: 11, max: 999}
		},
		division: {
			t1: {min: 120, max: 9999},
			t2: {min: 11, max: 99},
			decimals: 1
		}
	},
	operator:{
		addition: {label:'+', operator:'+'},
		subtraction: {label:'-', operator:'-'},
		division: {label: '\u00F7', operator: '/'},//'&divide;'
		multiplication: {label:'x', operator:'*'}
	},
	btnMessage: {active: "Submit Answer", inActive: "Next Question"}
})

.config(function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: 'views/menu.htm' 
	}).when('/exercises/:type', {
		templateUrl: 'views/exercises.htm',
		controller:'exercisesCtrl'
	}).when('/config', {
		templateUrl: 'views/configuration.htm'
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
		},
		capitalizeFirstLetter: function(str){
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
	};
})

.service("questions", function(settings, utils){
	this._getTerms = function(tpe){
		var range = settings.range[tpe],
			term1 = utils.getRandomInt(range.t1.min, range.t1.max),
			term2 = utils.getRandomInt(range.t2.min, range.t2.max),
			cnt = 0;

		switch (tpe){
			case "addition":
				cnt = 0;  
				while (term1 + term2 < range.result.min || term1 + term2 > range.result.max){
					term1 = utils.getRandomInt(range.t1.min + cnt, range.t1.max - cnt);
					term2 = utils.getRandomInt(range.t2.min + cnt, range.t2.max - cnt);
					cnt++;
				}
				break;
			case "subtraction": 
				cnt = 0;
				while (term1 - term2 < range.result.min || term1 - term2 > range.result.max){
					term1 = utils.getRandomInt(range.t1.min + cnt, range.t1.max);
					term2 = utils.getRandomInt(range.t2.min, range.t2.max - cnt);
					cnt++;
				}
				break;
			case "multiplication": 
				break;
			case "division": 
				if (settings.range.division.decimals === 0){
					term1 = term2 * utils.getRandomInt(Math.floor(range.t1.min / range.t2.min), Math.floor(range.t1.max /range.t2.max));
				} else {
					while (parseInt(term1.toString().slice(0, term2.toString().length), 10) < term2){
						term1 = utils.getRandomInt(range.t1.min, range.t1.max);
						term2 = utils.getRandomInt(range.t2.min, range.t2.max);
					}
				}
				break;
		}
		return {term1: term1, term2:term2};
	};

	this._getHelpFields = function(tpe, terms){
		var nrOfHelpFields = 0,
			fields = [];
		switch (tpe){
			case "addition": break;
			case "subtraction": break;
			case "multiplication": 
				nrOfHelpFields = terms.term2.toString().length; break;
			case "division": 
				nrOfHelpFields = (terms.term1.toString().length - 1 ) * 2; 
				var t2Len = terms.term2.toString().length;
				var t1Offset = settings.range.division.t1.max.toString().length - terms.term1.toString().length;
				for(var indx = 0; indx < nrOfHelpFields; indx++){
					fields.push({width:'width' + (t2Len + (indx === 0 ? 0 : 1)),
								offset:'offset' + (t1Offset + Math.floor(Math.abs((indx - 1) / 2)))});
				}
				break;
		}
		return fields;
	};

	this._getLen = function(terms, tpe){
		var len = Math.max(terms.term1.toString().length, terms.term2.toString().length);
		if (tpe === "division"){
			len = settings.range.division.t1.max.toString().length;
		}
		return len;
	};

	this.getQuestion = function(tpe){
		var terms = {},
			len = 0,
			answer; 

		terms = this._getTerms(tpe);
		len = this._getLen(terms, tpe);
		answer = eval(terms.term1 + settings.operator[tpe].operator + terms.term2);
		if (tpe === "division"){
			var div = Math.pow(10, settings.range.division.decimals);
			answer = Math.floor(answer * div) / div;
		}
		return {
			terms: {
				1: utils.pad(terms.term1, " ", len), 
				2: tpe !== "division" ? utils.pad(terms.term2, " ", len) : terms.term2
			},
			operator: settings.operator[tpe].label,
			len: len,
			fields: this._getHelpFields(tpe, terms),
			answer: answer
		};
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

.controller("exercisesCtrl", function($scope, $routeParams, utils){
	$scope.type = $routeParams.type;
	$scope.title = utils.capitalizeFirstLetter($routeParams.type);
})

.directive("calcMenu", function(){
	return{
		restrict: 'E',
		replace: true,
		templateUrl: 'views/directives/menu.htm',
		controller: function($scope){
			$scope.isMenuCollapsed = true;
		}
	};
})

.directive("calcHeader", function(){
	return{
		restrict: 'E',
		replace: true,
		scope: {title: '@'},
		templateUrl: 'views/directives/header.htm',
		controller: function($scope){
			$scope.isHeaderCollapsed = true;
		}
	};
})

.directive("calcConfig", function(settings){
	return{
		restrict: 'E',
		replace: true,
		scope: {},
		templateUrl: 'views/directives/config.htm',
		controllerAs: 'config',
		controller: function(){
			this.range = settings.range;
			this.nrOfQuestions = settings.nrOfQuestions;
			this.updateConfig = function(){
				this.msg = "Your changes have been submitted";
			};
			this.changed = function(){
				this.msg = "";
			};
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
		templateUrl: 'views/directives/exercise.htm',
		scope: {type:'@'},
    	bindToController: true,
    	controllerAs: 'ctrl',
		controller: function(settings, questions, results){
			results.init();
			this.nr = 1;
			this.subview = "question";
			this.subviewType = this.type === "addition" || this.type === "subtraction" ? "addsub" : this.type;
			this.maxNr = settings.nrOfQuestions;
			this.correct = [];
			this.isWrongAnswer = false;
			this.btnMessage = settings.btnMessage.active;
			this.question = questions.getQuestion(this.type);
			this.clearField = function(fieldName){
				this.question[fieldName] = "";
				this.setFocus = true;
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
        templateUrl: 'views/directives/progress.htm'
    };
})

.directive('exerciseResults', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {results:'='}, 
        templateUrl: 'views/directives/result.htm'
    };
});

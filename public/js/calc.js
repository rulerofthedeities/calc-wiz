angular.module("kmCalc", ['ngRoute', 'ui.bootstrap', 'km.translate', 'mediaPlayer'])

.constant("DEFAULTS",{	
	'templateDir': 'views/directives/',
	'languages': [
		{'code': 'en', 'name':'English'}, 
		{'code': 'nl', 'name': 'Nederlands'}
		]
	})

.config(function($routeProvider){
	var translationResolve = ['kmts', 
  		function(kmts){
			return kmts.promise; 
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

	customRouteProvider.when('/', {
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

.factory("user", function(){
	var user = {name:""};
	return {
		setUserName: function(name){
			user.name = name;
		},
		getUserName: function(){
			return user.name;
		}
	};
})

.factory("setFocus", function($timeout, $window){
	return function(id) {
		$timeout(function() {
			var element = $window.document.getElementById(id);
			if(element){
				element.focus();
			}
		});
	};
})

.service("config", function($http, $log, settings, configFileName){
	this.saveConfigFile = function(){
		$http.post('saveconfig?file=' + encodeURI(configFileName), settings).then(function(){
			$log.info("Saved file '" + configFileName + "'");
			return true;
		},
		function(){
			$log.error("Error saving file '" + configFileName + "'");
			return false;
		});
	};
})

.service("questions", function(settings, utils){
	function Question(args){
		this.tpe = args.tpe;
		this.operator = settings.operator[args.tpe].label;
		this.hasRemainder = settings.range.division.remainder;
		this.userAnswer = null;
	}

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
				cnt = 0;
				while (term1 * term2 < range.result.min || term1 * term2 > range.result.max){
					term1 = utils.getRandomInt(range.t1.min + cnt, range.t1.max - cnt);
					term2 = utils.getRandomInt(range.t2.min + cnt, range.t2.max - cnt);
					cnt++;
				}
				break;
			case "division": 
				var checkIfTerm2FitsInTerm1 = function(term1, term2){
					return parseInt(term1.toString().slice(0, term2.toString().length), 10) < term2;
				};
				if (!settings.range.division.remainder){
					do {
						term1 = term2 * utils.getRandomInt(Math.floor(range.t1.min / range.t2.min), Math.floor(range.t1.max /range.t2.max));
					} while (checkIfTerm2FitsInTerm1(term1, term2));
				} else {
					while (checkIfTerm2FitsInTerm1(term1, term2)){
						term1 = utils.getRandomInt(range.t1.min, range.t1.max);
						term2 = utils.getRandomInt(range.t2.min, range.t2.max);
					}
				}
				break;
		}
		return {term1: term1, term2:term2};
	};

	this._getHelpFields = function(terms, tpe){
		var nrOfHelpFields = 0,
			fields = [],
			indx;
		switch (tpe){
			case "addition": break;
			case "subtraction": break;
			case "multiplication": 
				nrOfHelpFields = terms.term2.toString().length; 
				var t1Len = terms.term1.toString().length;

				for(indx = 0; indx < nrOfHelpFields; indx++){
					fields.push({width:'width' + (t1Len + 1),
								offset:'offset' + indx});
				}

				break;
			case "division": 
				nrOfHelpFields = (terms.term1.toString().length - 1 ) * 2; 
				var t2Len = terms.term2.toString().length;
				var t1Offset = settings.range.division.t1.max.toString().length - terms.term1.toString().length;
				for(indx = 0; indx < nrOfHelpFields; indx++){
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

	this.getAnswer = function(terms, tpe){
		var answer,
			remainder;

		answer = eval(terms["1"] + settings.operator[tpe].operator + terms["2"]);
		if (tpe === "division"){
			answer = Math.floor(answer);
			remainder = parseInt(terms[1], 10) % parseInt(terms[2], 10);
		}

		return {'answer':answer, 'remainder':remainder};
	};

	this.getQuestion = function(tpe){
		var question = new Question({'tpe': tpe}),
			terms = this._getTerms(tpe),
			termLen = this._getLen(terms, tpe),
			answer;

		question.helpFields = this._getHelpFields(terms, tpe);
		terms = {
			1: utils.pad(terms.term1, " ", termLen), 
			2: tpe !== "division" ? utils.pad(terms.term2, " ", termLen) : terms.term2.toString()
		};
		answer = this.getAnswer(terms, tpe);
		question.termLen = termLen;
		question.answLen = answer.answer.toString().length;
		question.terms = terms;

		return {'question': question, 'answer': answer};
	};

	this.getQuestions = function(tpe){
		var questions = [],
			answers = [],
			question;
		for (var indx = 0; indx < settings.general.nrOfQuestions; indx++){
			question = this.getQuestion(tpe);
			questions.push(question.question);
			answers.push(question.answer);
		}
		return {'questions': questions, 'answers': answers};
	};

	this.checkAnswer = function(){
		return function(userAnswer, correctAnswer){
			var correct = {'answer':false, 'remainder':true, 'all':false};

			if (parseInt(userAnswer.answer, 10) === correctAnswer.answer){
				correct.answer = true;
			}
			if (correctAnswer.remainder && parseInt(userAnswer.remainder, 10) !== correctAnswer.remainder){
				correct.remainder = false;
			}
			correct.all = correct.answer && correct.remainder;
			return correct;
		};
	};

})

.service("exercise", function($rootScope, $log, questions, settings, results){
	var exercise;

	function Exercise(args){
		this.tpe = args.tpe;
		this.nrOfQuestions = settings.general.nrOfQuestions;
		this.started = Date.now();
		this.exerciseCompleted = function(){
			this.ended = Date.now();
		};
	}

	this.createExercise = function(tpe){
		var exQuestions = questions.getQuestions(tpe);

		exercise = new Exercise({'tpe' : tpe});
		exercise.questions = exQuestions.questions;
		exercise.answers = exQuestions.answers;
		exercise.checkAnswer = questions.checkAnswer;
		return exercise;
	};

	$rootScope.$on("$routeChangeSuccess", function (e, args) {
		if (exercise) {
			results.endExercise(exercise);
			$log.warn("User unexpectedly stopped exercise");
		}
	});
})

.service("results", function(){
	var results;

	this.init = function(){
		results = {questions:[]};
	};

	this.addResult = function(question, userAnswer, correctAnswer, correct, nr){
		var result = {
			nr: nr + 1,
			question: question, 
			userAnswer: userAnswer,
			correctAnswer: correctAnswer,
			correct: correct
		};
		results.questions.push(result);
	};

	this._processResults = function(){
		for(var indx = 0, countCorrect = 0; indx < this.results.questions.length; indx++){
			if(this.results.questions[indx].correct.all) {
				countCorrect++;
			}
		}
		results.totals = {
			nrOfQuestions: this.results.questions.length,
			correct: countCorrect,
			percentage: countCorrect / this.results.questions.length * 100
		};
	};

	this._saveResults = function(){
		//Save to db
		console.log("Saving results");
		console.log(results);
	};

	this.endExercise = function(exercise){
		var ended = exercise.ended || Date.now();
		results.timing = {
			started: exercise.started,
			ended: ended,
			elapse: ended - exercise.started
		};
		this._saveResults();
	};

	this.getResults = function(exercise){
		this.endExercise(exercise);
		this._processResults();
		return results;
	};
})

.controller("exercisesCtrl", function($scope, $routeParams, utils){
	$scope.type = $routeParams.type;
	$scope.title = utils.capitalizeFirstLetter($routeParams.type);
})


.controller("loginCtrl", function($scope, $uibModal, $log){

	var data = {};
	data.email = "test@yahoo.com";

	$scope.openModal = function (size) {
		var modalInstance = $uibModal.open({
			animation: true,
			scope: $scope.$new(true),
			templateUrl: 'views/login.htm',
			controller: 'modalLoginCtrl', 
			size: size || 'md',
			resolve: {
				data: function () {
					return data;
				}
			}
		});
		modalInstance.result.then(function (loginData) {
	     	$log.info(loginData);
	    }, function () {
	    	//Modal closed
	    });
  	};

})

.controller('modalLoginCtrl', function ($scope, $uibModalInstance, translate, data) {
	$scope.login = data;

	$scope.ok = function () {
		$uibModalInstance.close($scope.login);
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
})

.directive("calcAudio", function(DEFAULTS, settings){
	return{
		restrict: 'E',
		templateUrl: DEFAULTS.templateDir + 'audio.htm',
		controller: function($scope){
			$scope.playSound = function (sound) {
				var audio = $scope[sound];
				audio.playPause();
			};
			$scope.$on('audio', function(event, args) {
				if (settings.general.audio){
					$scope.playSound(args.sound);
				}
			});
		}
	};
})

.directive("calcMenu", function(DEFAULTS){
	return{
		restrict: 'E',
		replace: true,
		templateUrl: DEFAULTS.templateDir + 'menu.htm',
		controller: function($scope){
			$scope.isMenuCollapsed = true;
		}
	};
})

.directive("calcHeader", function(DEFAULTS){
	return{
		restrict: 'E',
		replace: true,
		scope: {title: '@'},
		templateUrl: DEFAULTS.templateDir + 'header.htm',
		controller: function($scope){
			$scope.isHeaderCollapsed = true;
		}
	};
})

.directive("calcConfig", function(config, settings, DEFAULTS, translate, kmtp){
	return{
		restrict: 'E',
		replace: true,
		scope: {},
		templateUrl: DEFAULTS.templateDir + 'config.htm',
		controllerAs: 'config',
		controller: function($scope){
			this.range = settings.range;
			this.general = settings.general;
			this.updateConfig = function(){
				if (config.saveConfigFile()){
					this.msg = translate.translate("Your changes have been submitted");
					kmtp.setCurrentLanguage(settings.general.language);
					$scope.configForm.$setPristine();
				}
			};
			this.labels = {
				"language": translate.translate("Language"),
				"questions": translate.translate("No of questions"),
				"audio": translate.translate("Audio"),
				"total": translate.translate("Total"),
				"term": translate.translate("Term"),
				"min": translate.translate("min"),
				"max": translate.translate("max"),
				"remainder": translate.translate("Remainder")
			};
			
		},
		link: function(scope, element, attr) {
        	scope.$watch('config.general.language', function(newLan, oldLan) {
				if (oldLan !== newLan){
					kmtp.setCurrentLanguage(newLan);
				}
			});

		}
	};
})

.directive("lanSelect", function(DEFAULTS){
	return{
		templateUrl: DEFAULTS.templateDir + 'lanselect.htm',
		controller: function($scope){
			$scope.config.languages = DEFAULTS.languages;
		}
	};
})

.directive("panelView", function(){
	return{
		controller: function($scope){ 
			$scope.subview = "question";
			$scope.changeView = function(newView){
				$scope.subview = newView;
			};
		}
	};
})

.directive('caret', function() {

    function setCaretPosition(elem, caretPos) {
        if (elem !== null) {
            if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.move('character', caretPos);
                range.select();
            } else {
                if (elem.selectionStart) {
                    elem.focus();
                    elem.setSelectionRange(caretPos, caretPos);
                }
            }
        }
    }

    return {
        link: function(scope, element, attrs) {
            var caret = Number(attrs.caret),
            	field = attrs.ngModel;
            if (field){
	            scope.$watch(field, function(newValue, oldValue) {
	                if (newValue && newValue != oldValue && !isNaN(newValue) ) {
	                    setCaretPosition(element[0], caret);
	                }
	            });
        	}
        }
    };
})


.directive("calcExercise", function(DEFAULTS, translate, setFocus){

	return {
		restrict: 'E',
		replace: true,
		templateUrl: DEFAULTS.templateDir + 'exercise.htm',
		scope: {type:'@'},
    	bindToController: true,
    	controllerAs: 'ctrl',
		controller: function($scope, exercise, settings, results){
			var calcExercise = exercise.createExercise(this.type),
				correctAnswer,
				startTime;

			this.init = function(){
				this.question = calcExercise.questions[this.nr - 1];
				correctAnswer = calcExercise.answers[this.nr - 1];
				startTime = Date.now();
				this.isCorrectAnswer = {'answer': true, 'remainder': true, 'all': true};
				this.setFocus = true;
			};

			this.submitAnswer = function(){
				var answer = {
						'answer': this.question.userAnswer, 
						'remainder': this.question.remainder,
						'elapseTime' : Date.now() - startTime
					},
					correct = calcExercise.checkAnswer()(answer, correctAnswer);
				results.addResult(this.question, answer, correctAnswer, correct, this.nr);
				this.correct[this.nr - 1] = correct.all;

				if (correct.all){
					$scope.$emit('audio', {'sound':'ok'});
					this.nextQuestion();
				} else {
					$scope.$emit('audio', {'sound':'nok'});
					this.isCorrectAnswer = correct;
					this.correctAnswer = correctAnswer;
					setFocus('wrongnext');
				}
			};

			this.nextQuestion = function(){
				if (this.nr < this.maxNr){
					this.nr++;
					this.init();
				} else {
					calcExercise.exerciseCompleted();
					this.results = results.getResults(calcExercise);
					this.subview = "results";
					if (this.results.totals.percentage == 100){
						$scope.$emit('audio', {'sound':'cheer'});
					}
				}
			};

			this.nr = 1;
			this.subview = "question";
			this.subviewType = this.type === "addition" || this.type === "subtraction" ? "addsub" : this.type;
			this.maxNr = settings.general.nrOfQuestions;
			this.correct = [];
			this.btnMessageCorrect = translate.translate(settings.btnMessage.active);
			this.btnMessageIncorrect = translate.translate(settings.btnMessage.inActive);
			
			results.init();
			this.init();
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

.directive('fixBackspace', function() {
	return function(scope, element, attr) {
		element[0].onkeydown = function(event) {
			//Remove last entered digit if backspace key is pressed
			var key = event.keyCode || event.charCode,
				no = this.value.toString(),
				newno = "";
			for (var i = no.length - 1; i > 0; i--){
				newno = no[i] + newno;
			}
			newno += ' ';
			if (key === 8){
				this.value = newno;
			}
		};
	};
})

.directive('exerciseProgress', function(DEFAULTS) {
    return {
        restrict: 'E',
        replace: true,
        scope: {correct:'='},
        templateUrl: DEFAULTS.templateDir + 'progress.htm'
    };
})

.directive('exerciseResults', function(DEFAULTS) {
    return {
        restrict: 'E',
        replace: true,
        scope: {results:'='}, 
        templateUrl: DEFAULTS.templateDir + 'result.htm'
    };
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
				.config(['kmtpProvider', function(kmtpProvider){
					kmtpProvider.configSetCurrentLanguage(configResponse.data.general.language);
					kmtpProvider.configSetTranslationFile("json/translate.json", "lan");
				}]);
				angular.bootstrap(document, ['kmCalc'], true);
		},
		function(){
			$log.error("Error loading configuration file '" + jsonDir + configFileName + "'");
		}
	);
});


angular.module("kmCalc", ['ngRoute', 'ui.bootstrap', 'km.translate', 'mediaPlayer', 'ngAnimate'])

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
	}).when('/results', {
		templateUrl: 'views/results.htm'
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
		},
		objToParams: function(obj) {
			var parms = [];
			for (var p in obj) {
				if (obj.hasOwnProperty(p)) {
					parms.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				}
			}
			return parms.join("&");
		}
	};
})

.factory("user", function(){
	var defUser = {name:"anonymous"},
		key = 'calc-wiz-user',
		user = angular.copy(defUser);
		
	return {
		getUserName: function(){
			return user.name;
		},
		getUser: function(){
			return user;
		},
		login: function(newUser){
			user.name = newUser.name;
			user.email = newUser.email;
			this.save();
			$scope.$broadcast('user', {'name':newUser.name});
		},
		logout: function(){
			user = defUser;
			$scope.$broadcast('user', {'name':user.name});
			return user.name;
		},
		load: function(){
			var userData = localStorage.getItem(key);
			userData = JSON.parse(userData);
			if (userData){
				user.name = userData.name;
			} else {
				user.name = defUser.name;
			}
			return user;
		},
		save: function(){
			var toSave = {
				'name': user.name
			};
			localStorage.setItem(key, JSON.stringify(toSave));
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
		$http.post('/config?file=' + encodeURI(configFileName), settings).then(function(){
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

		question.helpers = {};
		question.helpers.helpFields = this._getHelpFields(terms, tpe);
		terms = {
			1: utils.pad(terms.term1, " ", termLen), 
			2: tpe !== "division" ? utils.pad(terms.term2, " ", termLen) : terms.term2.toString()
		};
		answer = this.getAnswer(terms, tpe);
		question.helpers.answLen = answer.answer.toString().length;
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

.service("exercise", function($rootScope, $log, questions, results, user){
	var exercise;

	function Exercise(args){
		this.tpe = args.tpe;
		this.user = user.getUser();
		this.started = Date.now();
		this.interrupted = false;
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
		if (exercise && !exercise.finished && results.getNrOfResultsDone() > 0) {
			exercise.interrupted = true;
			results.endExercise(exercise);
			$log.warn("User unexpectedly stopped exercise");
		}
	});
})

.service("results", function($http, $log, user, utils){
	var results;

	this.init = function(exercise){
		results = {
			questions:[],
			tpe:exercise.tpe,
			nrOfQuestions:exercise.nrOfQuestions,
			timing: {started:exercise.started}
		};
	};

	this.getNrOfResultsDone = function(){
		return results.questions.length;
	};

	this.addResult = function(newResult){
		var result = angular.copy(newResult);

		delete result.question.helpFields;

		results.questions.push(result);
	};

	this._processResults = function(){
		for(var indx = 0, countCorrect = 0; indx < results.questions.length; indx++){
			if(results.questions[indx].answer.correct.all) {
				countCorrect++;
			}
		}
		results.totals = {
			nrOfQuestions: results.questions.length,
			correct: countCorrect,
			percentage: countCorrect / results.questions.length * 100
		};
	};

	this._saveResults = function(){
		//Save to db
		$http.post('/results', results).then(
			function(){
				$log.info("Saved results to database.");
				return true;
			},
			function(){
				$log.error("Error saving results to database");
				return false;
		});
	};

	this.endExercise = function(exercise){
		var ended = exercise.ended || Date.now();
		exercise.finished = true;

		results.timing.ended = ended;
		results.timing.elapse = ended - exercise.started;
		results.timing.interrupted = exercise.interrupted;
		results.user = {name: user.getUserName()};
		this._processResults();
		this._saveResults();
	};

	this.getResults = function(exercise){
		this.endExercise(exercise);
		return results;
	};

	this.fetchAllResults = function(filter, callback){
		var filters = filter,
			filteredResults = null,
			params = utils.objToParams(filters);
		//filters.user = user.getUserName();
		$http.get('/results?' + params).then(function(response){
			callback(response.data);
		});

	};
})

.filter('msToTime', function () {
	return function (input) {
		var sec = parseInt(input / 1000, 10);
		if (isNaN(sec)) return "00:00:00";

		var hours = Math.floor(sec / 3600),
			minutes = Math.floor((sec - (hours * 3600)) / 60),
			seconds = sec - (hours * 3600) - (minutes * 60);

		return [("0" + hours).substr(-2), ("0" + minutes).substr(-2), ("0" + seconds).substr(-2)].join(":");
	};
})

.controller("exercisesCtrl", function($scope, $routeParams, utils){
	$scope.type = $routeParams.type;
	$scope.title = utils.capitalizeFirstLetter($routeParams.type);
})

.controller("loginCtrl", function($scope, $uibModal, $log, user){

	var data = {};
	//data.email = "test@yahoo.com";

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
	     	if (loginData.name){
	     		user.login(loginData);
	     	}
	    }, function () {
	    	//Modal closed
	    });
  	};

  	$scope.logOut = function(){
  		$scope.user.name = user.logout();
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

.directive("datePicker", function(DEFAULTS, translate){
	return{
		restrict:'E',
		templateUrl: DEFAULTS.templateDir + 'datepicker.htm',
		controller: 
		function ($scope, $filter) {
			$scope.labels = {
				main: translate.translate("Date"),
				close: translate.translate("Close"),
				today: translate.translate("Today"),
				clear: translate.translate("Clear")
			};
			
			$scope.today = function() {
				$scope.dt = new Date();
			};

			$scope.clear = function () {
				$scope.dt = null;
			};
			$scope.clear();

			$scope.maxDate = new Date();

			$scope.open = function($event) {
				$scope.status.opened = true;
			};

			$scope.dateOptions = {
				formatYear: 'yy',
				startingDay: 1
			};

			$scope.formats = ['dd/MM/yy'];
			$scope.format = $scope.formats[0];

			$scope.status = {
				opened: false
			};

		    $scope.$watch('dt', function(newDt, oldDt) {
				if (oldDt !== newDt){
					$scope.filterDt = $filter('date')(newDt, "dd/MM/yy");
				}
			});
		}
	};
})

.controller('resultsCtrl', function($scope, $filter, utils, results, msToTimeFilter, user, translate){
	var resultsTable;

	getResultsTable = function(){
		var serverFilter = {
			'user':user.getUserName(),
			'completed':$scope.filter.completed
		};
		results.fetchAllResults(serverFilter, function(resultsArr){
			//format in controller since filters are slow in repeats
			angular.forEach(resultsArr, function(result){
				result.tpe = translate.translate(utils.capitalizeFirstLetter(result.tpe));
				result.name = result.user.name;
				result.timing.elapse = msToTimeFilter(result.timing.elapse);
				result.started = $filter('date')(result.timing.started, "dd/MM/yy HH:mm");
				result.timing.completed = result.timing.interrupted ? translate.translate("No") : translate.translate("Yes");
				result.totals.correct = result.totals.correct + '/' + result.totals.nrOfQuestions;
				result.totals.percentage = Math.round(result.totals.percentage);
				result.perfect = result.totals.percentage == 100;
			});
			$scope.resultsTable = resultsArr;
			resultsTable = resultsArr;
		});
	};

	$scope.updateFilter = function(){
		getResultsTable();
	};

	$scope.showDetailResult = function(indx){
		$scope.currentInsert = $scope.currentInsert == indx ? null : indx;
		$scope.detailResult = [];
		$scope.detailResult[indx] = resultsTable[indx];
	};

	$scope.user = user.getUserName();
	//initialize filter
	$scope.filter = {
		completed: true,
		tpes: [
			{val: "", name: translate.translate("All Exercises")},
			{val: translate.translate("Addition")},
			{val: translate.translate("Subtraction")},
			{val: translate.translate("Multiplication")},
			{val: translate.translate("Division")}]
	};
	$scope.filterLabels = {
		completed: translate.translate("Completed only"),
		type: translate.translate("Type"),
		date: translate.translate("Date")
	};
	$scope.tableHeaders = {
		name: translate.translate("Name"),
		tpe: translate.translate("Type"),
		start:translate.translate("Start"),
		correct: translate.translate("Correct"),
		perc: translate.translate("Percentage"),
		time: translate.translate("Elapse Time"),
		completed: translate.translate("Completed")
	};

	$scope.$on('user', function(event, args) {
		console.log("user updated");
		$scope.user = args.name;
		getResultsTable();
	});

	getResultsTable();

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
			$scope.isMenuCollapsed = false;
		}
	};
})

.directive("calcHeader", function(DEFAULTS, user){
	return{
		restrict: 'E',
		replace: true,
		scope: {title: '@'},
		templateUrl: DEFAULTS.templateDir + 'header.htm',
		controller: function($scope){
			$scope.isHeaderCollapsed = true;
			$scope.user = user.load();
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
				this.userAnswer = "";
				correctAnswer = calcExercise.answers[this.nr - 1];
				startTime = Date.now();
				this.isCorrectAnswer = {'answer': true, 'remainder': true, 'all': true};
				this.setFocus = true;
			};

			this.submitAnswer = function(){
				var answer = {
						'answer': this.userAnswer, 
						'remainder': this.question.remainder,
						'elapseTime' : Date.now() - startTime
					},
					correct = calcExercise.checkAnswer()(answer, correctAnswer);
				results.addResult({
					nr: this.nr,
					question: this.question, 
					answer: {
						userAnswer: answer, 
						correctAnswer: correctAnswer, 
						correct: correct
					}
				});
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
			
			results.init(calcExercise);
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
		scope: {results:'=', showHeader:'='}, 
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


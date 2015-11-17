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

.service("config", function($http, $log, settings, configFileName){
	this.saveConfigFile = function(){
		 var req = {
			 method: 'POST',
			 url: '/updateconfig',
			 headers: {
			   'Content-Type': "application/json"
			 },
			 data: settings
			};
		$http(req).then(function(response) {
			$log.info("Saved config file");
			return true;
		}, function(){
			$log.error("Error saving config file");
			return false;
		});
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
				cnt = 0;
				while (term1 * term2 < range.result.min || term1 * term2 > range.result.max){
					term1 = utils.getRandomInt(range.t1.min + cnt, range.t1.max - cnt);
					term2 = utils.getRandomInt(range.t2.min + cnt, range.t2.max - cnt);
					cnt++;
				}
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
			answer: answer,
			ansLen: answer.toString().length
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

.directive("calcAudio", function(DEFAULTS){
	return{
		restrict: 'E',
		templateUrl: DEFAULTS.templateDir + 'audio.htm',
		controller: function($scope){
			$scope.playSound = function (sound) {
				var audio = $scope[sound];
				audio.playPause();
			};
			$scope.$on('audio', function(event, args) {
				$scope.playSound(args["sound"]);
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
		controller: function(){
			this.range = settings.range;
			this.general = settings.general;
			this.updateConfig = function(){
				/*
				if (config.saveConfigFile()){
					this.msg = translate.translate("Your changes have been submitted");
					kmtp.setCurrentLanguage(settings.general.language);
				}
				*/
			};
			this.changed = function(){
				this.msg = "";
			};
			this.labels = {
				"language": translate.translate("Language"),
				"questions": translate.translate("No of questions"),
				"total": translate.translate("Total"),
				"term": translate.translate("Term"),
				"min": translate.translate("min"),
				"max": translate.translate("max"),
				"decimals": translate.translate("Decimals")
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


.directive("calcExercise", function(DEFAULTS, translate){

	return {
		restrict: 'E',
		replace: true,
		templateUrl: DEFAULTS.templateDir + 'exercise.htm',
		scope: {type:'@'},
    	bindToController: true,
    	controllerAs: 'ctrl',
		controller: function($scope, settings, questions, results){
			results.init();
			this.nr = 1;
			this.subview = "question";
			this.subviewType = this.type === "addition" || this.type === "subtraction" ? "addsub" : this.type;
			this.maxNr = settings.general.nrOfQuestions;
			this.correct = [];
			this.isWrongAnswer = false;
			this.btnMessage = translate.translate(settings.btnMessage.active);
			this.question = questions.getQuestion(this.type);
			this.submitAnswer = function(answer){
				if (this.isWrongAnswer){
					this.nextQuestion();
				} else {
					this.question.nr = this.nr;
					if (parseInt(this.question.useranswer, 10) === this.question.answer){
						results.addResult(this.question, true, this.nr);
						this.correct[this.nr - 1] = true;
						$scope.$emit('audio', {'sound':'ok'});
						this.nextQuestion();
					} else {
						results.addResult(this.question, false, this.nr);
						this.correct[this.nr - 1] = false;
						this.isWrongAnswer = true;
						this.btnMessage = translate.translate(settings.btnMessage.inActive);
						$scope.$emit('audio', {'sound':'nok'});
					}
				}
			};

			this.nextQuestion = function(){
				if (this.nr < this.maxNr){
					this.isWrongAnswer = false;
					this.btnMessage = translate.translate(settings.btnMessage.active);
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
		configFileName = "assets/json/config.json",
		translateFileName = "assets/json/translate.json",
		promise = $http.get(configFileName);

	promise.then(
		function(configResponse){
			$log.info("Configuration file '" + configFileName + "' loaded");

			angular.module('kmCalc')
				.value('settings', configResponse.data)
				.value("configFileName", configFileName)
				.config(['kmtpProvider', function(kmtpProvider){
					kmtpProvider.configSetCurrentLanguage(configResponse.data.general.language);
					kmtpProvider.configSetTranslationFile("assets/json/translate.json", "lan");
				}]);
				angular.bootstrap(document, ['kmCalc'], true);
		},
		function(){
			$log.error("Error loading configuration file '" + configFileName + "'");
		}
	);
});


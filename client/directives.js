(function(ng, app){

	"use strict";

	app
	.directive("datePicker", function(DEFAULTS, kmTranslate){
		return{
			restrict:'E',
			templateUrl: DEFAULTS.templateDir + 'datepicker.htm',
			controller: 
			function ($scope, $filter) {
				$scope.labels = {
					main: kmTranslate.translate("Date"),
					close: kmTranslate.translate("Close"),
					today: kmTranslate.translate("Today"),
					clear: kmTranslate.translate("Clear")
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
				$scope.userName = user.getUserName();
				$scope.$on('user:updated', function(event, data) {
					$scope.userName = data.name;
				});
			}
		};
	})

	.directive("calcConfig", function(config, settings, DEFAULTS, kmTranslate, kmTranslateConfig){
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
						this.msg = kmTranslate.translate("Your changes have been submitted");
						kmTranslateConfig.setCurrentLanguage(settings.general.language);
						$scope.configForm.$setPristine();
					}
				};
				this.labels = {
					"language": kmTranslate.translate("Language"),
					"questions": kmTranslate.translate("No of questions"),
					"audio": kmTranslate.translate("Audio"),
					"total": kmTranslate.translate("Total"),
					"term": kmTranslate.translate("Term"),
					"min": kmTranslate.translate("min"),
					"max": kmTranslate.translate("max"),
					"remainder": kmTranslate.translate("Remainder")
				};
				
			},
			link: function(scope, element, attr) {
				scope.$watch('config.general.language', function(newLan, oldLan) {
					if (oldLan !== newLan){
						kmTranslateConfig.setCurrentLanguage(newLan);
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


	.directive("calcExercise", function(DEFAULTS, kmTranslate, setFocus){

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
				this.btnMessageCorrect = kmTranslate.translate(settings.btnMessage.active);
				this.btnMessageIncorrect = kmTranslate.translate(settings.btnMessage.inActive);
				
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

	.directive('parseInput', function(utils) {
		return function(scope, element, attr) {
			element[0].onkeydown = function(event) {
				var key = event.keyCode || event.charCode,
					validKeys = [189, 13, 8];

				//Only digits or special characters
				if ((key < 96 || key > 105) && !utils.isInArray(validKeys, key)){
					//invalid key
					event.preventDefault();
				}
				if (attr.fixBackspace !== undefined){
					//Remove last entered digit if backspace key is pressed
					var no = this.value.toString(),
						newno = "";
					for (var i = no.length - 1; i > 0; i--){
						newno = no[i] + newno;
					}
					newno += ' ';
					if (key === 8){
						this.value = newno;
					}
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
	
})(angular, kmCalc);

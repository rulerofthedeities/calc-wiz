(function( ng, app ) {
	
	"use strict";

	app
	.factory("utils", function(){
		return {
			getRandomInt : function(min, max) {
				return Math.floor(Math.random() * (max - min + 1)) + min;
			},
			pad: function(str, padding, len){
				str = new Array(len + 1).join(padding) + str;
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
			},
			isInArray: function(arr, needle){
				return ~arr.indexOf(needle);
			}
		};
	})

	.factory("user", function($rootScope, $q, $timeout){
		var defUser = {name:"demo"},
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
				$rootScope.$broadcast('user:updated', {'name':user.name});
				this.save();
			},
			logout: function(){
				user = angular.copy(defUser);
				return user.name;
			},
			save: function(){
				var toSave = {
					'name': user.name
				};
				localStorage.setItem(key, JSON.stringify(toSave));
			},
			load: function(){
				var deferred = $q.defer();

				var userData = localStorage.getItem(key);
				deferred.resolve(userData);

				return deferred.promise;
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
	});


})( angular, kmCalc );
(function(ng, app){
	
	"use strict";

	app
	.controller("exercisesCtrl", function($scope, $routeParams, utils){
		$scope.type = $routeParams.type;
		$scope.title = utils.capitalizeFirstLetter($routeParams.type);
	})

	.controller("loginCtrl", function($scope, $uibModal, user, config){

		var data = {};
		//data.email = "test@yahoo.com";
		data.name = $scope.userName;

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
		     	if (loginData.name){
		     		user.login(loginData);
		     		config.setSettings(loginData.name);
		     	}
		    }, function () {
		    	//Modal closed
		    });
	  	};

	  	$scope.logOut = function(){
	  		$scope.userName = user.logout();
	  	};
	})

	.controller('modalLoginCtrl', function ($scope, $uibModalInstance, data) {

		$scope.ok = function (isValid) {
			if (isValid){
				$uibModalInstance.close($scope.login);
			} else {
				$scope.showError = true;
			}
		};

		$scope.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};
	})

	.controller('resultsCtrl', function($scope, $filter, utils, results, msToTimeFilter, user, kmTranslate){
		var resultsTable,
			self = this;

		this.getResultsTable = function(){
			var serverFilter = {
				'user':user.getUserName(),
				'completed':$scope.filter.completed
			};
			results.fetchAllResults(serverFilter, function(resultsArr){
				//format in controller since filters are slow in repeats
				angular.forEach(resultsArr, function(result){
					result.tpe = kmTranslate.translate(utils.capitalizeFirstLetter(result.tpe));
					result.name = result.user.name;
					result.timing.elapse = msToTimeFilter(result.timing.elapse);
					result.started = $filter('date')(result.timing.started, "dd/MM/yy HH:mm");
					result.timing.completed = result.timing.interrupted ? kmTranslate.translate("No") : kmTranslate.translate("Yes");
					result.totals.correct = result.totals.correct + '/' + result.totals.nrOfQuestions;
					result.totals.percentage = Math.round(result.totals.percentage);
					result.perfect = result.totals.percentage == 100;
				});
				$scope.resultsTable = resultsArr;
				resultsTable = resultsArr;
			});
		};

		$scope.updateFilter = function(){
			self.getResultsTable();
		};

		$scope.showDetailResult = function(indx){
			$scope.currentInsert = $scope.currentInsert == indx ? null : indx;
			$scope.detailResult = [];
			$scope.detailResult[indx] = resultsTable[indx];
		};

		$scope.userName = user.getUserName();
		//initialize filter
		$scope.filter = {
			completed: true,
			tpes: [
				{val: "", name: kmTranslate.translate("All Exercises")},
				{val: kmTranslate.translate("Addition")},
				{val: kmTranslate.translate("Subtraction")},
				{val: kmTranslate.translate("Multiplication")},
				{val: kmTranslate.translate("Division")}]
		};
		$scope.filterLabels = {
			completed: kmTranslate.translate("Completed only"),
			type: kmTranslate.translate("Type"),
			date: kmTranslate.translate("Date")
		};
		$scope.tableHeaders = {
			name: kmTranslate.translate("Name"),
			tpe: kmTranslate.translate("Type"),
			start: kmTranslate.translate("Start"),
			correct: kmTranslate.translate("Correct"),
			perc: kmTranslate.translate("Percentage"),
			time: kmTranslate.translate("Elapse Time"),
			completed: kmTranslate.translate("Completed")
		};

		$scope.$on('user:updated', function(event, data) {
			$scope.userName = data.name;
			self.getResultsTable();
		});

		this.getResultsTable();

	});

})(angular, kmCalc);
var app = angular.module('DemoApp', ['ngMaterial', 'toaster']);
app.controller('MainCtrl', function ($scope, toaster) {

	$scope.categories = ['Teacher', 'Student'];
	$scope.feeds = [{ type: 'Text', value: 0 }, { type: 'Scale', value: 1 }, { type: 'Scale and Text', value: 2 }];
	$scope.answerindex = 0;
	$scope.questionplan = '';
	$scope.hideindex = false;
	$scope.deletingprogresskey = false;
	$scope.warning = function (msg) {
		toaster.pop('warning', "Warning", msg, 3000);
	};
	$scope.success = function (msg) {
		toaster.pop('success', "Success", msg, 3000);
	};
	$scope.error = function (msg) {
		toaster.pop("error", "Error", msg, 3000);
	};
	$scope.info = function (msg) {
		toaster.pop("info", "info", msg, 3000);
	};
	$scope.reload = function () {
		window.location.reload();
	}
	//this function protecs double of $apply()
	$scope.safeApply = function (fn) {
		var phase = this.$root.$$phase;
		if (phase == '$apply' || phase == '$digest') {
			if (fn && (typeof (fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};

	// =====================================================================================|
	//                                                                  					|
	// 								Question set functions									|
	//                                                                  					|
	// =====================================================================================|


	//get sets in the group and total set lists
	$scope.getAllQuesionSets = function () {
		$scope.createdByMe = true;
		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var setdata = firebase.database().ref('QuestionSets');
				setdata.on('value', function (snapshot) {
					$scope.questionSetLists = {};
					snapshot.forEach(function (child) {
						var createdByMe = (uid == child.val()['creator']) ? true : false;
						$scope.questionSetLists[child.key] = {
							setname: child.val()['setname'],
							key: child.key,
							createdByMe: createdByMe,
							tags: child.val()['tags'],
							visibleBytag: true,
						}
					});
					$scope.safeApply();
				});
			} else {
				$scope.error("You need to login!");
			}
		});
	}
	$scope.changeCretedByMe = function (value) {
		$scope.createdByMe = value;
		$scope.safeApply();
	}
	$scope.showQuestionsInSet = function (set) {
		localStorage.setItem('questionsetkey', set.key);
		localStorage.setItem('questionsetName', set.setname);
		window.location.href = './viewquestion/questions.html';
	}

	// =====================================================================================|
	//                                                                  					|
	// 								Creat Question Set										|
	//                                                                  					|
	// =====================================================================================|
	$scope.creatQuestionSet = function () {
		if (!$scope.setname) {
			$scope.error("Please insert Question Set name.");
			return;
		}

		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var tags = "";
				$scope.selectedTags.forEach(function (tagObj) {
					if (tags == "") {
						tags = tagObj.name;
					} else {
						tags += "," + tagObj.name;
					}
				});

				var Setdetails = { setname: $scope.setname, creator: uid, tags: tags };		//Questions

				var storesRef = firebase.database().ref().child('QuestionSets');

				storesRef.orderByChild('setname').equalTo($scope.setname).once('value', function (snapshot) {
					if (snapshot.val()) { 				// same setname is exist
						$scope.error("This Question Set name is already exist.");
						$scope.safeApply();
						return;
					} else {
						var newStoreRef = storesRef.push();									//Add record to Question table in fireabse
						newStoreRef.set(Setdetails).then(function (data) {
							var tagRef = firebase.database().ref('Tags');
							$scope.selectedTags.forEach(function (tagObj) {
								if (tagObj.type == 'new') tagRef.push(tagObj.name);
							});
							$scope.safeApply();
							localStorage.setItem("questionsetName", $scope.setname);
							$scope.success('Question Set is created successfully!');
							setTimeout(function () {
								window.location.href = './choiceCreateQuestionType.html';
							}, 500)
						})
					}
				});
			} else {
				$scope.error("You need to login!");
			}
		});
	}

	// =====================================================================================|
	//                                                                  					|
	// 								Chip functions   										|
	//                                                                  					|
	// =====================================================================================|

    /**
     * Return the proper object when the append is called.
     */
	$scope.transformChip = function (chip) {
		// If it is an object, it's already a known chip
		if (angular.isObject(chip)) {
			return chip;
		}

		// Otherwise, create a new one
		return { name: chip, type: 'new' };
	}

    /**
     * Search for vegetables.
     */
	$scope.querySearch = function (query) {
		var results = query ? $scope.originTags.filter($scope.createFilterFor(query)) : [];
		return results;
	}

    /**
     * Create filter function for a query string
     */
	$scope.createFilterFor = function (query) {
		var lowercaseQuery = angular.lowercase(query);

		return function filterFn(tag) {
			return (tag.lowername.indexOf(lowercaseQuery) === 0);
		};

	}

	$scope.loadTags = function () {
		$scope.searchText = null;
		$scope.originTags = [];
		$scope.selectedTags = [];
		//$scope.transformChip = $scope.transformChip;

		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var tagRef = firebase.database().ref('Tags');
				tagRef.once('value', function (snapshot) {
					snapshot.forEach(function (tag) {
						$scope.originTags.push({ 'name': tag.val(), 'type': 'origin', 'lowername': tag.val().toLowerCase() })
					});
					$scope.safeApply();
				});
			} else {
				$scope.error("You need to login!");
			}
		});
	}

	$scope.chipChanged = function () {
		if ($scope.selectedTags.length == 0) {
			for (const setkey in $scope.questionSetLists) {
				$scope.questionSetLists[setkey].visibleBytag = true;
			}
		} else {
			for (const setkey in $scope.questionSetLists) {
				$scope.questionSetLists[setkey].visibleBytag = false;

				if ($scope.questionSetLists[setkey].tags == undefined) continue;
				var setTagArray = $scope.questionSetLists[setkey].tags.toLowerCase().split(',');
				for (const tagIndex in $scope.selectedTags) {
					var low = $scope.selectedTags[tagIndex].name.toLowerCase();
					if (setTagArray.indexOf(low) != -1) {
						$scope.questionSetLists[setkey].visibleBytag = true;
						break;
					}
				}
			}
		}
		$scope.safeApply();
	}
	//  --------------------------------------------------------------------
	//                     end of Auto complete chips




});
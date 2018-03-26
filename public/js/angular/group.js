var app = angular.module('DemoApp', ['ngMaterial', 'toaster']);
app.controller('MainCtrl', function ($scope, toaster) {

	$scope.categories = ['Teacher', 'Student'];
	$scope.feeds = [{ type: 'Text', value: 0 }, { type: 'Scale', value: 1 }, { type: 'Scale and Text', value: 2 }];
	$scope.answerindex = 0;
	$scope.questionplan = '';
	$scope.hideindex = false;
	$scope.deletingprogresskey = false;
	$scope.loadingfinished = true;

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
	// 								Groups functions									|
	//                                                                  					|
	// =====================================================================================|

	//=======================get groups functions===============     
	$scope.getgroups = function () {
		$scope.loadingfinished = false;
		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var groupdata = firebase.database().ref('Groups/' + uid);
				groupdata.on('value', function (snapshot) {
					$scope.groups = [];
					snapshot.forEach(function (childSnapshot) {
						$scope.groups.push({ groupname: childSnapshot.val()['groupname'], key: childSnapshot.key + "/" + uid });
					});
					$scope.loadingfinished = true;
					if ($scope.groups.length == 0) {
						$scope.warning("There isn't any group!");
					}
					$scope.safeApply();
				});
			} else {
				$scope.error("You need to login!");
				$scope.loadingfinished = true;
				$scope.safeApply();
			}
		});
	}

	$scope.creatgroup = function () {
		var userid = firebase.auth().currentUser.uid;
		var groupdetails = { groupname: $scope.groupname };//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('Groups/' + userid);
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(groupdetails).then(function () {
			$scope.success('Group is created successfully!')
			$scope.safeApply();
			setTimeout(function () {
				$scope.reload()
			}, 500);
		})
	}
	// ===================== show group detail functions==============================
	$scope.gotoGroupDetails = function (obj) {
		localStorage.setItem("groupkey", obj.key);
		localStorage.setItem("groupname", obj.groupname);
		window.location.href = './group/choiceGroupAction.html';
	}
	//delete group
	$scope.deletegroup = function (group) {
		var key = group.key.split("/")[0];
		firebase.database().ref('Groups/' + firebase.auth().currentUser.uid + '/' + key).remove().then(function () {
			$scope.success('Removed Successfully!')
			$scope.safeApply()
		});
	}

	$scope.gotoGroupDetails1 = function (obj) {
		localStorage.setItem("groupkey", obj.key);
		localStorage.setItem("groupname", obj.groupname);
		window.location.href = './editGroupQuestionSets.html';
	}


	$scope.gotoGroupExport = function (obj) {
		localStorage.setItem("groupkey", obj.key);
		localStorage.setItem("groupname", obj.groupname);
		window.location.href = '../exportAnswer/exportAll.html';
	}

	// =====================================================================================|
	//                                                                  					|
	// 								Edit Group functions									|
	//                                                                  					|
	// =====================================================================================|


	//get sets in the group and total set lists
	$scope.getQuesionSets = function () {//
		$scope.createdByMe = true;
		$scope.setsInGroup = {};
		$scope.grouptitle = localStorage.getItem("groupname");
		var groupkey = localStorage.getItem("groupkey").split("/")[0];
		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var setIngroupdata = firebase.database().ref('Groups/' + uid + '/' + groupkey + '/QuestionSets');
				setIngroupdata.on('value', function (snapshot) {
					snapshot.forEach(function (set) {
						$scope.setsInGroup[set.val()['key']] = set.val();
					});
					var setdata = firebase.database().ref('QuestionSets');
					setdata.on('value', function (snapshot) {
						$scope.questionSetLists = {};
						snapshot.forEach(function (child) {
							var existInGroup = ($scope.setsInGroup[child.key]) ? true : false;
							var createdByMe = (uid == child.val()['creator']) ? true : false;
							$scope.questionSetLists[child.key] = {
								setname: child.val()['setname'],
								key: child.key,
								existInGroup: existInGroup,
								createdByMe: createdByMe,
							}
						})
						$scope.safeApply();
					});
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
	//add set to group
	$scope.addtogroup = function (set) {
		$scope.setsInGroup[set.key] = { setname: set.setname, key: set.key };
		$scope.questionSetLists[set.key].existInGroup = true;
	}
	//remove set from group
	$scope.removefromgroup = function (set) {
		$scope.questionSetLists[set.key].existInGroup = false;
		delete $scope.setsInGroup[set.key];
	}
	//Function to save Question sets in the group
	$scope.saveGroupSet = function () {
		var rootRef = firebase.database().ref();
		var updates = {};
		var uid = firebase.auth().currentUser.uid;
		var groupkey = localStorage.getItem("groupkey").split("/")[0];

		updates['/Groups/' + uid + '/' + groupkey + '/QuestionSets'] = $scope.setsInGroup;
		rootRef.update(updates).then(function () {
			$scope.success('Question Sets are imported successfully!')
			$scope.safeApply();
		});
	}

	// =====================================================================================|
	//                                                                  					|
	// 								Responses in Group functions									|
	//                                                                  					|
	// =====================================================================================|




	$scope.getAllQuesionsInGroup = function () {//

		$scope.createdByMe = true;
		$scope.setsInGroup = {};
		$scope.grouptitle = localStorage.getItem("groupname");

		$scope.loadingfinished = false;
		var groupkey = localStorage.getItem("groupkey").split("/")[0];

		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var setIngroupdata = firebase.database().ref('Groups/' + uid + '/' + groupkey + '/QuestionSets');
				setIngroupdata.on('value', function (snapshot) {
					$scope.feedbackTypequestions = {};
					$scope.digitTypequestions = {};
					$scope.textTypequestions = {};
					$scope.dropdownTypequestions = {};
					$scope.slideTypequestions = {};

					var loopCount = snapshot.numChildren();
					snapshot.forEach(function (set) {
						$scope.setsInGroup[set.val()['key']] = set.val();
						var questionsetkey = set.val()['key'];
						var questionsetName = set.val()['setname'];


						$scope.feedbackTypequestions[questionsetkey] = {};
						$scope.digitTypequestions[questionsetkey] = {};
						$scope.textTypequestions[questionsetkey] = {};
						$scope.dropdownTypequestions[questionsetkey] = {};
						$scope.slideTypequestions[questionsetkey] = {};


						// ++++++++++++++++++ get Feedback Type Questions ++++++++++++++++++
						loopCount += 5;
						var qtdata = firebase.database().ref('Questions').orderByChild("Set").equalTo(questionsetkey);
						qtdata.on('value', function (snapshot) {
							snapshot.forEach(function (childSnapshot) {
								$scope.feedbackTypequestions[questionsetkey][childSnapshot.key] = {
									key: childSnapshot.key,
									value: childSnapshot.val()['question'],
									setName: questionsetName, type: 'Feedback Type'
								};
							});
							loopCount--;
							if (loopCount == 0) {
								$scope.loadingfinished = true;
							}
							$scope.safeApply();
						});

						// ++++++++++++++++++ get digit Type Questions ++++++++++++++++++

						var qtdata = firebase.database().ref('DigitQuestions').orderByChild("Set").equalTo(questionsetkey);
						qtdata.on('value', function (snapshot) {
							snapshot.forEach(function (childSnapshot) {
								$scope.digitTypequestions[questionsetkey][childSnapshot.key] = {
									key: childSnapshot.key,
									value: childSnapshot.val()['question'],
									setName: questionsetName, type: 'Digit Type'
								};
							});
							loopCount--;
							if (loopCount == 0) {
								$scope.loadingfinished = true;
							}
							$scope.safeApply();
						});

						// ++++++++++++++++++ get text Type Questions ++++++++++++++++++

						var qtdata = firebase.database().ref('TextQuestions').orderByChild("Set").equalTo(questionsetkey);
						qtdata.on('value', function (snapshot) {
							snapshot.forEach(function (childSnapshot) {
								$scope.textTypequestions[questionsetkey][childSnapshot.key] = {
									key: childSnapshot.key,
									value: childSnapshot.val()['question'],
									setName: questionsetName, type: 'Text Type'
								};
							});
							loopCount--;
							if (loopCount == 0) {
								$scope.loadingfinished = true;
							}
							$scope.safeApply();
						});

						// ++++++++++++++++++ get dropdown Type Questions ++++++++++++++++++

						var qtdata = firebase.database().ref('DropdownQuestions').orderByChild("Set").equalTo(questionsetkey);
						qtdata.on('value', function (snapshot) {
							snapshot.forEach(function (childSnapshot) {
								$scope.dropdownTypequestions[questionsetkey][childSnapshot.key] = {
									key: childSnapshot.key,
									value: childSnapshot.val()['question'],
									setName: questionsetName, type: 'Dropdown Type'
								};
							});
							loopCount--;
							if (loopCount == 0) {
								$scope.loadingfinished = true;
							}
							$scope.safeApply();
						});

						// ++++++++++++++++++ get slide Type Questions ++++++++++++++++++

						var qtdata = firebase.database().ref('SlideQuestions').orderByChild("Set").equalTo(questionsetkey);
						qtdata.on('value', function (snapshot) {
							snapshot.forEach(function (childSnapshot) {
								$scope.slideTypequestions[questionsetkey][childSnapshot.key] = {
									key: childSnapshot.key,
									value: childSnapshot.val()['question'],
									setName: questionsetName, type: 'Slide Type'
								};
							});
							loopCount--;
							if (loopCount == 0) {
								$scope.loadingfinished = true;
							}
							$scope.safeApply();
						});
						loopCount--;
						if (loopCount == 0) {
							$scope.loadingfinished = true;
						}
						$scope.safeApply();

					});

				});
				$scope.safeApply();
			} else {
				$scope.error("You need to login!");
				$scope.loadingfinished = true;
				$scope.safeApply();
			}

		});
	}

	$scope.exportQuestionDatas = function (key, question, dbname) {
		localStorage.setItem("exportQuestionKey", key);
		localStorage.setItem("exportQuestionsentence", question);
		localStorage.setItem("databasename", dbname);
		setTimeout(function () {
			window.location.href = './responsesOfAnswer.html';
		}, 1000);
	}

	$scope.exportDropdownQuestionDatas = function (key, question, dbname) {
		localStorage.setItem("exportQuestionKey", key);
		localStorage.setItem("exportQuestionsentence", question);
		localStorage.setItem("databasename", dbname);
		setTimeout(function () {
			window.location.href = './responseOfDropdownAnswer.html';
		}, 1000);
	}

	$scope.initExport = function () {
		$scope.hidefeedfield = true;
		var exportQuestionKey = localStorage.getItem("exportQuestionKey");
		$scope.exportQuestionsentence = localStorage.getItem("exportQuestionsentence");
		$scope.databasename = localStorage.getItem("databasename");

		$scope.loadingfinished = false;
		$scope.getAnswers(exportQuestionKey, $scope.exportQuestionsentence);
		$scope.safeApply();
	}

	$scope.getAnswers = function (exportQuestionKey, exportQuestionsentence) {
		$scope.answers = [];
		var answers = firebase.database().ref($scope.databasename + '/' + exportQuestionKey + '/answer');
		answers.on('value', function (snapshot) {
			if (!snapshot.val()) {
				$scope.loadingfinished = true;
				$scope.safeApply();
			}

			$scope.feedtextlimit = 0;
			var resultaverage;
			snapshot.forEach(function (childSnapshot) {
				var answerkey = childSnapshot.key;
				//Get Feedback Texts and max count
				if ($scope.databasename != 'Answers') {
					$(".detachingfield").detach();
				}
				if ($scope.databasename == 'Answers') {
					$scope.hidefeedfield = false;
					var totalfeedtexts = firebase.database().ref('FeedbackTexts/' + exportQuestionKey + '/' + answerkey);
					var texts = [];
					$scope.thcols = [];
					totalfeedtexts.on('value', function (snapshot) {
						var j = 0;
						if (!snapshot.val()) {
							texts[j] = '';
							j++;
						} else {
							snapshot.forEach(function (feedsnap) {
								texts[j] = feedsnap.val();
								j++;
							});
						}
						if (j > $scope.feedtextlimit)
							$scope.feedtextlimit = j;
						$scope.texts = texts;
					});
					//Get Average score
					var totalsumscore = 0;
					var countscore = 0;
					var totalsocre = firebase.database().ref('Feedbacks/' + exportQuestionKey + '/' + answerkey);
					totalsocre.on('value', function (snapshot1) {
						snapshot1.forEach(function (childSnapshot) {
							for (var t = 0; t < childSnapshot.val().length; t++) {
								totalsumscore += childSnapshot.val()[t]
								countscore++;
							}
						});
					});
				}

				//GetUser's Profile
				var userProfile = firebase.database().ref('Users/' + answerkey);
				var profileinformation;
				$scope.profileinformation = [];
				userProfile.on('value', function (snapshot) {
					profileinformation = snapshot.val();
				});
				//Combination
				setTimeout(function () {
					if (countscore == 0 || totalsumscore == 0) resultaverage = 0;
					else {
						resultaverage = (totalsumscore / countscore).toFixed(1);
					}
					setTimeout(function () {
						for (var k = 0; k < $scope.feedtextlimit; k++) {
							$scope.thcols[k] = '1';
						}
						$scope.answers.push({
							'mail': childSnapshot.val()['mail'],
							'question': exportQuestionsentence,
							'answer': childSnapshot.val()['answer'],
							'datetime': childSnapshot.val()['datetime'],
							'feedtxt': texts, 'averagescore': resultaverage,
							'Country': profileinformation.country,
							'Gender': profileinformation.gender,
							'Profession': profileinformation.profession,
							'Age': profileinformation.age,
							'Mothertongue': profileinformation.countrylanguage,
							'Groupcode': profileinformation.groupcode
						});
						$scope.safeApply();
					}, 2000);
				}, 1000)

				$scope.loadingfinished = true;
			});


		});
	}

	$scope.viewQuestionDropdownanswer = function () {

		var exportQuestionKey = localStorage.getItem("exportQuestionKey");
		$scope.exportQuestionsentence = localStorage.getItem("exportQuestionsentence");
		$scope.databasename = localStorage.getItem("databasename");

		$scope.loadingfinished = false;
		$scope.chartLavels = [];
		$scope.chartValues = [];
		var totalAnswers = 0;
		var answersRef = firebase.database().ref($scope.databasename + '/' + exportQuestionKey + '/answer');
		answersRef.on('value', function (snapshot) {
			snapshot.forEach(function (answer) {
				var index = $scope.chartLavels.indexOf(answer.val().answer);
				if (index === -1) {
					$scope.chartLavels.push(answer.val().answer);
					$scope.chartValues.push(1);
				} else {
					$scope.chartValues[index]++;
				}
				totalAnswers++;
			});
			var i = 0;
			for (i = 0; i < $scope.chartLavels.length; i++) {
				//$scope.chartValues[i] = Math.round($scope.chartValues[i] / totalAnswers * 1000) / 10;
				if ($scope.chartLavels[i].length > 53) {
					$scope.chartLavels[i] = $scope.chartLavels[i].substring(0, 49) + " ...";
				}
			}
			if ($scope.chartValues.length == 0) {
				toaster.pop("error", "Error", "Sorry,There is not any data!", 1000);
				$scope.safeApply();
			}
			$scope.paintgraph($scope.chartLavels, $scope.chartValues, "pieChart");
		});
	}

	$scope.paintgraph = function (title, value, Dom) {
		var canvas = document.getElementById(Dom);
		var ctx = canvas.getContext("2d");
		// ==========update chart================
		if ($scope.myChart) {
			$scope.myChart.data.labels = title;
			$scope.myChart.data.datasets[0].data = value;
			$scope.myChart.update();
			return;
		}

		//=========== create chart=================
		$scope.myChart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: title,
				datasets: [{
					label: '# of Votes',
					data: value,
					backgroundColor: [
						'rgba(230, 25, 75, 0.3)',
						'rgba(47, 71, 255, 0.2)',
						'rgba(255, 225, 25, 0.4)',
						'rgba(129, 72, 68, 0.2)',
						'rgba(60, 180, 75, 0.6)',
						'rgba(245, 130, 48, 0.5)',
						'rgba(145, 30, 180, 0.4)',
						'rgba(70, 240, 240, 0.3)',
						'rgba(0, 128, 128, 0.5)',
						'rgba(230, 190, 255, 0.3)',
						'rgba(170, 110, 40, 0.4)',
						'rgba(170, 255, 195, 0.2)',
						'rgba(255, 215, 180, 0.6)',
						'rgba(240, 50, 230, 0.7)',
						'rgba(210, 245, 60, 0.2)',
						'rgba(255, 206, 86, 0.7)',
						'rgba(75, 192, 192, 0.5)',
						'rgba(153, 102, 255, 0.3)',
						'rgba(255, 159, 64, 0.4)',
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.6)'
					],
					borderColor: [
						'rgba(230, 25, 75, 1)',
						'rgba(47, 71, 255, 1)',
						'rgba(255, 225, 25, 1)',
						'rgba(129, 72, 68, 1)',
						'rgba(60, 180, 75, 1)',
						'rgba(245, 130, 48, 1)',
						'rgba(145, 30, 180, 1)',
						'rgba(70, 240, 240,1)',
						'rgba(0, 128, 128, 1)',
						'rgba(230, 190, 255, 1)',
						'rgba(170, 110, 40, 1)',
						'rgba(170, 255, 195, 1)',
						'rgba(255, 215, 180, 1)',
						'rgba(240, 50, 230,1)',
						'rgba(210, 245, 60, 1)',
						'rgba(255, 206, 86, 1)',
						'rgba(75, 192, 192, 1)',
						'rgba(153, 102, 255, 1)',
						'rgba(255, 159, 64, 1)',
						'rgba(255,99,132,1)',
						'rgba(54, 162, 235, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]

				}
			}
		});
	}
	$scope.copyToClipboard = function (str) {
		var $temp = $("<input>");
		$("body").append($temp);
		$temp.val(str).select();
		document.execCommand("copy");
		$temp.remove();
	}

});

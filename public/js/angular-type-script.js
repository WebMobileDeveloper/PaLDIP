var app = angular.module('DemoApp', ['ngMaterial', 'toaster']);
app.controller('TypeCtrl', function ($scope, toaster) {

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
	$scope.submitAnswerDisableKey_digit = false;
	$scope.submitAnswerDisableKey_dropdown = false;
	$scope.submitAnswerDisableKey_slide = false;
	$scope.currentmytextanswer = localStorage.getItem("currentmytextanswer");
	$scope.currentmydropdownanswer = localStorage.getItem("currentmydropdownanswer");
	$scope.currentmyslideanswer = localStorage.getItem("currentmyslideanswer");
	$scope.currentmyslideanswerval = localStorage.getItem("currentmyslideanswerval");

	$scope.questionkey = localStorage.getItem('questionkey');
	$scope.question = localStorage.getItem('question');
	$scope.textanswer = localStorage.getItem("previoustextanswer");
	$scope.dropdownanswer = localStorage.getItem("previousdropdownanswer");
	if ($scope.textanswer) {
		$scope.submitAnswerDisableKey_digit = true;
	}
	if ($scope.dropdownanswer) {
		$scope.submitAnswerDisableKey_dropdown = true;
	}
	if ($scope.currentmyslideanswer) {
		$scope.submitAnswerDisableKey_slide = true;
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
	$scope.logout = function () {
		firebase.auth().signOut();
		window.location.href = '../../index.html';
	}
	setTimeout(function () {
		if (firebase.auth().currentUser == null)
			$scope.logout()
	}, 2500)
	///////////////////////////////////////////////////////-//////////////////////////////////////////////////////////////////////////////////////////////
	//Create Text Question
	$scope.creatTextQuestion = function () {
		//if question doesn't exist, return
		if ($scope.textQuestion == '' || $scope.textQuestion == undefined) {
			$scope.error('Please Input Question!');
			return;
		}
		if ($scope.questionset == undefined) {
			$scope.error('Please Select Question Set!');
			return;
		}
		if ($scope.temp_image == undefined) $scope.temp_image = ''
		//if feedback type is not selected, return
		//user mail
		var teachermail = firebase.auth().currentUser.email;
		var qtdetails = { question: $scope.textQuestion, teacher: teachermail, image: $scope.temp_image, Set: $scope.questionset };//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('TextQuestions');
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(qtdetails).then(function () {
			$scope.success('Question is created successfully!')
			$scope.safeApply();
			setTimeout(function () {
				$scope.reload()
			}, 500);
		})
	}
	//Get Text type Questions
	$scope.gettextqts = function () {
		$scope.questions = [];
		var questionsetkey = localStorage.getItem("questionsetkey");
		var qtdata = firebase.database().ref('TextQuestions').orderByChild("Set").equalTo(questionsetkey);
		qtdata.on('value', function (snapshot) {

			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				$scope.questions.push({ key: key, value: childData['question'] });
			});
			$scope.safeApply();
		});

	}
	$scope.gettextqtsteacherside = function () {
		$scope.questions = [];
		questionSets = [];

		var qtSetdata = firebase.database().ref('QuestionSets');
		qtSetdata.on('value', function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.key
				var childData = childSnapshot.val();
				questionSets[key] = childData['setname'];
				//$scope.questionSets.push(key : { key: key, value: childData['setname'] });
			});
			var qtdata = firebase.database().ref('TextQuestions');
			qtdata.on('value', function (snapshot) {

				snapshot.forEach(function (childSnapshot) {
					var key = childSnapshot.key
					var childData = childSnapshot.val();
					//when text feedback
					var set = childData['Set'];
					$scope.questions.push({ key: key, value: childData['question'], questionSet: questionSets[set] });
				});
				$scope.safeApply();
			});
		});
	}

	//save current selected Text type Question to localstorage
	$scope.goTextSubmitAnswer = function (key, question) {
		var myanswer = firebase.database().ref('TextAnswers/' + key + '/answer' + '/' + firebase.auth().currentUser.uid);
		myanswer.on('value', function (snapshot) {
			if (snapshot.val()) {
				localStorage.setItem("previoustextanswer", snapshot.val()['answer']);
			} else {
				localStorage.setItem("previoustextanswer", '');
			}
		})
		localStorage.setItem("questionkey", key);
		localStorage.setItem("question", question);
		setTimeout(function () {
			window.location.href = './submittextanswer.html';
		}, 1000);
	}
	//Submit Text Type Answer about selected question
	$scope.savetextanswer = function () {
		if ($scope.textanswer == undefined) {
			$scope.warning('Please Input your Answer.')
			return;
		}
		if (firebase.auth().currentUser) {
			var updates = {};
			var currentdate = new Date();
			var datetime = currentdate.getDate() + "/"
				+ (currentdate.getMonth() + 1) + "/"
				+ currentdate.getFullYear() + " @ "
				+ currentdate.getHours() + ":"
				+ currentdate.getMinutes() + ":"
				+ currentdate.getSeconds();
			updates['/TextAnswers/' + $scope.questionkey + '/' + 'question'] = $scope.question;
			updates['/TextAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/answer'] = $scope.textanswer;
			updates['/TextAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/mail'] = firebase.auth().currentUser.email;
			updates['/TextAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/datetime'] = datetime;
			$scope.success('Your Answer is Saved Successfully!');
			localStorage.setItem("currentmytextanswer", $scope.textanswer);
			firebase.database().ref().update(updates).then(function () {
				window.location.href = './viewClassTextanswer.html';
			}).catch(function (error) {
				$scope.error('Submit Error!')
			});
		} else {
			$scope.error('You have to login!');
		}

	}
	$scope.nextpage_text = function () {
		if (firebase.auth().currentUser) {
			var updates = {};
			localStorage.setItem("currentmytextanswer", $scope.textanswer);
			window.location.href = './viewClassTextanswer.html';
		} else {
			$scope.error('You have to login!');
		}
	}

	$scope.nextpage_dropdown = function () {
		if (firebase.auth().currentUser) {
			var updates = {};
			localStorage.setItem("currentmydropdownanswer", $scope.dropdownanswer);
			window.location.href = './viewClassDropdownanswer.html';
		} else {
			$scope.error('You have to login!');
		}
	}
	//Get Class Average Answer
	$scope.getclassAverage = function () {
		$scope.sumval = '';
		var i = 1;
		var textanswer = firebase.database().ref('TextAnswers/' + $scope.questionkey + '/answer');
		textanswer.on('value', function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				$scope.sumval += i + '.';
				$scope.sumval += childSnapshot.val()['answer'];
				$scope.sumval += '\n';
				i++;
			});
			$scope.safeApply()
		})
	}
	//delete question
	$scope.deletetextquestion = function (key) {
		if (confirm('Do you want to delete this question?')) {
			$scope.deletingprogresskey = true;
			firebase.database().ref('TextQuestions/' + key).remove().then(function () {
				$scope.success('Removed Successfully!');
				$scope.safeApply();
				setTimeout(function () {
					$scope.reload();
				}, 1000);
			});
		}
	}
	//setting add options in dropdown type
	$scope.choices = [];
	var optionindex = 0;
	$scope.addNewChoice = function () {
		if ($scope.dropdownQuestion == '' || $scope.dropdownQuestion == undefined) {
			$scope.warning('Please Input Question first!');
			return
		}


		if (optionindex > 20) {

			$scope.warning('Options are too much!');
			return;
		}
		var newItemNo = $scope.choices.length + 1;
		try {
			if ($scope.choices[optionindex * 1 - 1].name == undefined) {
				$scope.warning('Please Input option correctly!');
				return;
			}

		} catch (e) { }

		$scope.choices.push({ 'id': 'option' + newItemNo });
		optionindex++;
	};

	$scope.removeChoice = function () {
		var lastItem = $scope.choices.length - 1;
		$scope.choices.splice(lastItem);
		optionindex--;
	};

	$scope.creatDropdownQuestion = function () {
		if ($scope.choices[$scope.choices.length * 1 - 1].name == undefined) $scope.removeChoice()

		if ($scope.dropdownQuestion == '' || $scope.dropdownQuestion == undefined) {
			$scope.error('Please Input Question!');
			return;
		}
		if ($scope.questionset == undefined) {
			$scope.error('Please Select Question Set!');
			return;
		}
		if ($scope.temp_image == undefined) $scope.temp_image = ''
		//if feedback type is not selected, return
		//user mail
		var options = [];
		var i = 0;
		$scope.choices.forEach(function (childval) {
			options[i] = childval.name;
			i++;
		})
		var teachermail = firebase.auth().currentUser.email;

		var qtdetails = { question: $scope.dropdownQuestion, teacher: teachermail, options: options, image: $scope.temp_image, Set: $scope.questionset };//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('DropdownQuestions');
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(qtdetails).then(function () {
			$scope.success('Question is created successfully!')
			$scope.safeApply();
			setTimeout(function () {
				$scope.reload()
			}, 500);
		})
	}
	//Get Dropdown type Questions
	$scope.getdropdownqts = function () {
		$scope.questions = [];

		var questionsetkey = localStorage.getItem("questionsetkey");
		var qtdata = firebase.database().ref('DropdownQuestions').orderByChild("Set").equalTo(questionsetkey);

		qtdata.on('value', function (snapshot) {

			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				$scope.questions.push({ key: key, value: childData['question'] });
			});
			$scope.safeApply();
		});

	}
	$scope.getdropdownqtsteacherside = function () {
		$scope.questions = [];
		questionSets = [];

		var qtSetdata = firebase.database().ref('QuestionSets');
		qtSetdata.on('value', function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.key
				var childData = childSnapshot.val();
				questionSets[key] = childData['setname'];
				//$scope.questionSets.push(key : { key: key, value: childData['setname'] });
			});
			var qtdata = firebase.database().ref('DropdownQuestions');
			qtdata.on('value', function (snapshot) {

				snapshot.forEach(function (childSnapshot) {
					var key = childSnapshot.key
					var childData = childSnapshot.val();
					//when text feedback
					var set = childData['Set'];
					$scope.questions.push({ key: key, value: childData['question'], questionSet: questionSets[set] });
				});
				$scope.safeApply();
			});
		});

	}
	//delete question
	$scope.deletedropdownquestion = function (key) {
		if (confirm('Do you want to delete this question?')) {
			$scope.deletingprogresskey = true;
			firebase.database().ref('DropdownQuestions/' + key).remove().then(function () {
				$scope.success('Removed Successfully!');
				$scope.safeApply();
				setTimeout(function () {
					$scope.reload();
				}, 1000);
			});
		}
	}
	//save current selected Dropdown type Question to localstorage
	$scope.goDropdownSubmitAnswer = function (key, question) {
		var myanswer = firebase.database().ref('DropdownAnswers/' + key + '/answer' + '/' + firebase.auth().currentUser.uid);
		myanswer.on('value', function (snapshot) {
			if (snapshot.val()) {
				localStorage.setItem("previousdropdownanswer", snapshot.val()['answer']);
			} else {
				localStorage.setItem("previousdropdownanswer", '');
			}
		})
		localStorage.setItem("questionkey", key);
		localStorage.setItem("question", question);
		setTimeout(function () {
			window.location.href = './submitdropdownanswer.html';
		}, 1000);
	}
	//Get Dropdown type options
	$scope.getdropdownoptions = function () {
		$scope.options = [];

		var optiondata = firebase.database().ref('DropdownQuestions/' + $scope.questionkey);

		optiondata.on('value', function (snapshot) {
			$scope.options = snapshot.val()['options'];
		});

	}
	//Submit Text Type Answer about selected question
	$scope.savedropdownanswer = function () {
		studentgroupkey = localStorage.getItem("studentgroupkey");
		studentgroupname = localStorage.getItem("studentgroupname");



		$scope.dropdownanswer = $scope.options[$scope.dropdownanswerkey];
		if ($scope.dropdownanswer == undefined) {
			$scope.warning('Please Input your Answer.')
			return;
		}
		if (firebase.auth().currentUser) {
			var updates = {};
			var currentdate = new Date();
			var datetime = currentdate.getDate() + "/"
				+ (currentdate.getMonth() + 1) + "/"
				+ currentdate.getFullYear() + " @ "
				+ currentdate.getHours() + ":"
				+ currentdate.getMinutes() + ":"
				+ currentdate.getSeconds();
			updates['/DropdownAnswers/' + $scope.questionkey + '/' + 'question'] = $scope.question;
			updates['/DropdownAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/answer'] = $scope.dropdownanswer;
			updates['/DropdownAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/answerkey'] = $scope.dropdownanswerkey;
			updates['/DropdownAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/mail'] = firebase.auth().currentUser.email;
			updates['/DropdownAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/datetime'] = datetime;
			updates['/DropdownAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/studentgroupkey'] = studentgroupkey;
			updates['/DropdownAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/studentgroupname'] = studentgroupname;
			$scope.success('Your Answer is Saved Successfully!');
			localStorage.setItem("currentmydropdownanswer", $scope.dropdownanswer);
			firebase.database().ref().update(updates).then(function () {
				window.location.href = './viewClassDropdownanswer.html';
			}).catch(function (error) {
				$scope.error('Submit Error!');
			});
		} else {
			$scope.error('You have to login!');
		}

	}
	$scope.viewClassDropdownanswer = function () {
		$scope.mainvalues = [];
		$scope.mainlabels = [];
		$scope.othervalues = [];
		$scope.otherlabels = [];
		$scope.totalvalues = [];
		$scope.totallabels = [];
		$scope.selectedMain = true;
		$scope.selectedOther = false;

		mainvalues = [];
		mainlabels = [];
		othervalues = [];
		otherlabels = [];
		totalvalues = [];
		totallabels = [];


		
		var maincount = 0;
		var othercount = 0;
		var totalcount = 0;

		studentgroupkey = localStorage.getItem("studentgroupkey");

		var dropdownanswer = firebase.database().ref('DropdownAnswers/' + $scope.questionkey + '/answer');
		dropdownanswer.on('value', function (snapshot) {
			var countOfanswers = snapshot.numChildren();
			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.val()['answerkey'];
				if (childSnapshot.val()['studentgroupkey'] == studentgroupkey) {
					if (!mainvalues[key]) mainvalues[key] = 1;
					else mainvalues[key] += 1;
					mainlabels[key] = childSnapshot.val()['answer']
					maincount++;
				} else {
					if (!othervalues[key]) othervalues[key] = 1;
					else othervalues[key] += 1;
					otherlabels[key] = childSnapshot.val()['answer']
					othercount++;
				}
				if (!totalvalues[key]) totalvalues[key] = 1;
				else totalvalues[key] += 1;
				totallabels[key] = childSnapshot.val()['answer']
				totalcount++;
			});
			
		// 		mainvalues[mainkey] = $scope.mainvalues[k]
		// 		mainlabels[mainkey] = $scope.mainlabels[k]
		// 		mainkey++;
			for (var k = 0; k < mainvalues.length; k++) {
				if (mainlabels[k] == undefined)
					continue;
				$scope.mainvalues.push(mainvalues[k] / maincount * 100);
				$scope.mainlabels.push(mainlabels[k]);
			}
			for (var k = 0; k < othervalues.length; k++) {
				if (otherlabels[k] == undefined)
					continue;
				$scope.othervalues.push(othervalues[k] / othercount * 100);
				$scope.otherlabels.push(otherlabels[k]);				
			}
			for (var k = 0; k < totalvalues.length; k++) {
				if (totallabels[k] == undefined)
					continue;
				$scope.totalvalues.push(totalvalues[k] / totalcount * 100);
				$scope.totallabels.push(totallabels[k]);				
			}
			
			$scope.safeApply();
			$scope.paintgraph($scope.mainlabels, $scope.mainvalues, "pieChart");
		});
	}
	$scope.appliedClass = function (myObj) {
		if (myObj) {
			return "selected";
		} else {
			return "deselected";
		}
	}
	$scope.clickMain = function () {
		if ($scope.selectedOther) {
			$scope.selectedMain = !$scope.selectedMain;
		} else {
			$scope.selectedMain = true;
		}
		$scope.safeApply();
		$scope.drawDropdownAnswerChart();
	}
	$scope.clickOther = function () {
		if ($scope.selectedMain) {
			$scope.selectedOther = !$scope.selectedOther;
		} else {
			$scope.selectedOther = true;
		}
		$scope.safeApply();
		$scope.drawDropdownAnswerChart();
	}
	$scope.drawDropdownAnswerChart = function () {
		if ($scope.selectedMain) {
			if ($scope.selectedOther) {
				$scope.paintgraph($scope.totallabels, $scope.totalvalues, "pieChart");
			} else {
				$scope.paintgraph($scope.mainlabels, $scope.mainvalues, "pieChart");
			}
		} else {
			$scope.paintgraph($scope.otherlabels, $scope.othervalues, "pieChart");
		}
	}
	$scope.viewAllClassDropdownanswer = function () {

		$scope.mainvalues = [];
		$scope.mainlabels = [];
		var totalcount = 0;
		var mainvalues = [];
		var mainlabels = [];
		var mainkey = 0;

		var dropdownanswer = firebase.database().ref('DropdownAnswers').orderByChild('question').equalTo($scope.question);

		dropdownanswer.on("value", function (snapshot) {
			snapshot.forEach(function (data) {
				console.log(data.key);
			});
		});


		// dropdownanswer.on('value', function (snapshot) {
		// 	var countOfanswers = snapshot.numChildren();
		// 	snapshot.forEach(function (childSnapshot) {
		// 		var key = childSnapshot.val()['answerkey']
		// 		if (!$scope.mainvalues[key]) $scope.mainvalues[key] = 1 * 100 / countOfanswers;
		// 		else $scope.mainvalues[key] += (100 / countOfanswers);
		// 		$scope.mainlabels[key] = childSnapshot.val()['answer']
		// 		totalcount++;
		// 	});

		// 	for (var k = 0; k < $scope.mainlabels.length; k++) {
		// 		if ($scope.mainlabels[k] == undefined)
		// 			continue;
		// 		mainvalues[mainkey] = $scope.mainvalues[k]
		// 		mainlabels[mainkey] = $scope.mainlabels[k]
		// 		mainkey++;
		// 	}
		// 	$scope.safeApply();
		// 	$scope.paintgraph(mainlabels, mainvalues, "pieChart")
		// });




		// var dropdownanswer = firebase.database().ref('DropdownAnswers/' + $scope.questionkey + '/answer');
		// dropdownanswer.on('value', function (snapshot) {
		// 	var countOfanswers = snapshot.numChildren();
		// 	snapshot.forEach(function (childSnapshot) {
		// 		var key = childSnapshot.val()['answerkey']
		// 		if (!$scope.mainvalues[key]) $scope.mainvalues[key] = 1 * 100 / countOfanswers;
		// 		else $scope.mainvalues[key] += (100 / countOfanswers);
		// 		$scope.mainlabels[key] = childSnapshot.val()['answer']
		// 		totalcount++;
		// 	});

		// 	for (var k = 0; k < $scope.mainlabels.length; k++) {
		// 		if ($scope.mainlabels[k] == undefined)
		// 			continue;
		// 		mainvalues[mainkey] = $scope.mainvalues[k]
		// 		mainlabels[mainkey] = $scope.mainlabels[k]
		// 		mainkey++;
		// 	}
		// 	$scope.safeApply();
		// 	$scope.paintgraph(mainlabels, mainvalues, "pieChart")
		// });
	}


	$scope.slidequestions = [];
	var slideindex = 0;
	$scope.addNewslideRecord = function () {
		if ($scope.slideQuestion == '' || $scope.slideQuestion == undefined) {
			$scope.warning('Please Input Question first!');
			return
		}


		if (slideindex > 40) {

			$scope.warning('Questions are too much!');
			return;
		}
		var newItemNo = $scope.slidequestions.length + 1;
		try {
			if ($scope.slidequestions[slideindex * 1 - 1].propertyquestion == undefined || $scope.slidequestions[slideindex * 1 - 1].left == undefined || $scope.slidequestions[slideindex * 1 - 1].right == undefined) {
				$scope.warning('Please Input question correctly!');
				return;
			}

		} catch (e) { }

		$scope.slidequestions.push({ 'id': 'slide' + newItemNo });
		slideindex++;
	};

	$scope.removeslideRecord = function () {
		var lastItem = $scope.slidequestions.length - 1;
		$scope.slidequestions.splice(lastItem);
		slideindex--;
	};
	$scope.creatSlideQuestion = function () {
		if ($scope.slidequestions[slideindex * 1 - 1].propertyquestion == undefined || $scope.slidequestions[slideindex * 1 - 1].left == undefined || $scope.slidequestions[slideindex * 1 - 1].right == undefined)
			$scope.removeslideRecord()


		if ($scope.slideQuestion == '' || $scope.slideQuestion == undefined) {
			$scope.error('Please Input Question!');
			return;
		}
		if ($scope.questionset == undefined) {
			$scope.error('Please Select Question Set!');
			return;
		}
		if ($scope.temp_image == undefined) $scope.temp_image = ''
		//if feedback type is not selected, return
		//user mail

		var properties = [];
		var i = 0;
		$scope.slidequestions.forEach(function (childval) {
			properties[i] = { propertyquestion: childval.propertyquestion, right: childval.right, left: childval.left };
			i++;
		})
		var teachermail = firebase.auth().currentUser.email;

		var qtdetails = { question: $scope.slideQuestion, teacher: teachermail, properties: properties, image: $scope.temp_image, Set: $scope.questionset };//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('SlideQuestions');
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(qtdetails).then(function () {
			$scope.success('Question is created successfully!')
			$scope.safeApply();
			setTimeout(function () {
				$scope.reload();
			}, 500);
		})
	}
	$scope.goSlideSubmitAnswer = function (key, question) {
		var myanswer = firebase.database().ref('SlideAnswers/' + key + '/answer' + '/' + firebase.auth().currentUser.uid);
		myanswer.on('value', function (snapshot) {
			if (snapshot.val()) {
				localStorage.setItem("currentmyslideanswer", snapshot.val()['answer']);
				localStorage.setItem("currentmyslideanswerval", snapshot.val()['answerval']);
			} else {
				localStorage.setItem("currentmyslideanswer", '');
			}
		})
		localStorage.setItem("questionkey", key);
		localStorage.setItem("question", question);
		setTimeout(function () {
			window.location.href = './submitslideanswer.html';
		}, 1000);
	}
	//Get Slide type Questions
	$scope.getSlidesqts = function () {
		$scope.questions = [];
		var questionsetkey = localStorage.getItem("questionsetkey");
		console.log(questionsetkey)
		var qtdata = firebase.database().ref('SlideQuestions').orderByChild("Set").equalTo(questionsetkey);
		qtdata.on('value', function (snapshot) {

			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				$scope.questions.push({ key: key, value: childData['question'] });
			});
			$scope.safeApply();
		});

	}
	$scope.getSlidesqtsteacherside = function () {
		$scope.questions = [];
		questionSets = [];

		var qtSetdata = firebase.database().ref('QuestionSets');
		qtSetdata.on('value', function (snapshot) {
			snapshot.forEach(function (childSnapshot) {
				var key = childSnapshot.key
				var childData = childSnapshot.val();
				questionSets[key] = childData['setname'];
				//$scope.questionSets.push(key : { key: key, value: childData['setname'] });
			});
			var qtdata = firebase.database().ref('SlideQuestions');
			qtdata.on('value', function (snapshot) {

				snapshot.forEach(function (childSnapshot) {
					var key = childSnapshot.key
					var childData = childSnapshot.val();
					//when text feedback
					var set = childData['Set'];
					$scope.questions.push({ key: key, value: childData['question'], questionSet: questionSets[set] });
				});
				$scope.safeApply();
			});
		});
	}
	$scope.getSlides = function () {
		//Get Dropdown type options
		// $scope.properties = [];if($scope.currentmyslideanswer){
		if ($scope.submitAnswerDisableKey_slide == true) {
			setTimeout(function () {
				$scope.paintgraph($scope.currentmyslideanswer.split(','), $scope.currentmyslideanswerval.split(','), "pieChartforSlide2")
			}, 2500)
		} else {
			var properties = firebase.database().ref('SlideQuestions/' + $scope.questionkey + '/properties');
			var i = 0;
			$scope.slidetitles = [];
			$scope.slidegraph = [];
			properties.on('value', function (snapshot) {
				snapshot.forEach(function (childSnapshot) {

					$scope.slidetitles[i] = childSnapshot.val().propertyquestion;
					$scope.slidegraph[i] = 0;
					i++;
				});
				// $scope.options = snapshot.val()['options'];
				$scope.properties = snapshot.val();
				$scope.safeApply()
			});
			setTimeout(function () {
				$scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1")
			}, 2500);

		}

	}

	$scope.implementgraph = function () {
		$scope.safeApply();
		$scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1")
	}
	$scope.paintgraph = function (title, value, Dom) {

		if (title.length == 0) {
			toaster.pop("error", "Error", "Sorry,There is not any data!", 1000);
		}
		var ctx = document.getElementById(Dom).getContext('2d');
		var myChart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: title,
				datasets: [{
					label: '# of Votes',
					data: value,
					backgroundColor: [
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.2)',
						'rgba(255, 206, 86, 0.2)',
						'rgba(75, 192, 192, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(255, 159, 64, 0.2)',
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.2)',
						'rgba(255, 206, 86, 0.2)',
						'rgba(75, 192, 192, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(255, 159, 64, 0.2)',
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.2)',
						'rgba(255, 206, 86, 0.2)',
						'rgba(75, 192, 192, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(255, 159, 64, 0.2)',
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.2)'
					],
					borderColor: [
						'rgba(255,99,132,1)',
						'rgba(54, 162, 235, 1)',
						'rgba(255, 206, 86, 1)',
						'rgba(75, 192, 192, 1)',
						'rgba(153, 102, 255, 1)',
						'rgba(255, 159, 64, 1)',
						'rgba(255,99,132,1)',
						'rgba(54, 162, 235, 1)',
						'rgba(255, 206, 86, 1)',
						'rgba(75, 192, 192, 1)',
						'rgba(153, 102, 255, 1)',
						'rgba(255, 159, 64, 1)',
						'rgba(255,99,132,1)',
						'rgba(54, 162, 235, 1)',
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
	$scope.saveslideanswer = function () {
		if (firebase.auth().currentUser) {
			var updates = {};
			var currentdate = new Date();
			var datetime = currentdate.getDate() + "/"
				+ (currentdate.getMonth() + 1) + "/"
				+ currentdate.getFullYear() + " @ "
				+ currentdate.getHours() + ":"
				+ currentdate.getMinutes() + ":"
				+ currentdate.getSeconds();
			updates['/SlideAnswers/' + $scope.questionkey + '/' + 'question'] = $scope.question;
			updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/answer'] = $scope.slidetitles;
			updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/answerval'] = $scope.slidegraph;
			updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/mail'] = firebase.auth().currentUser.email;
			updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + firebase.auth().currentUser.uid + '/datetime'] = datetime;
			$scope.success('Your Answer is Saved Successfully!');
			localStorage.setItem("currentmyslideanswer", $scope.slidetitles);
			localStorage.setItem("currentmyslideanswerval", $scope.slidegraph);
			firebase.database().ref().update(updates).then(function () {
				window.location.href = './viewClassSlideanswer.html';
			}).catch(function (error) {
				$scope.error('Submit Error!')
			});
		} else {
			$scope.error('You have to login!');
		}
	}
	$scope.viewClassSlidenanswer = function () {
		var answer;
		var classSlideVal = [];
		var slideanswer = firebase.database().ref('SlideAnswers/' + $scope.questionkey + '/answer');
		slideanswer.on('value', function (snapshot) {
			console.log(snapshot.val())
			var countOfanswers = snapshot.numChildren();

			snapshot.forEach(function (childSnapshot) {
				answer = childSnapshot.val()['answer']
				var answerval = childSnapshot.val()['answerval']
				var answercount = childSnapshot.numChildren() / 2;

				for (var k = 0; k < answercount; k++) {
					console.log(answerval[k])
					if (!classSlideVal[k]) classSlideVal[k] = 0;
					classSlideVal[k] += answerval[k] * 1;
				}
				console.log(classSlideVal)
			});



		})


		setTimeout(function () {
			$scope.paintgraph($scope.currentmyslideanswer.split(','), $scope.currentmyslideanswerval.split(','), "mychart")
			$scope.paintgraph(answer, classSlideVal, "classchart")
		}, 2500)


	}
	//delete question
	$scope.deleteslidequestion = function (key) {
		if (confirm('Do you want to delete this question?')) {
			$scope.deletingprogresskey = true;
			firebase.database().ref('SlideQuestions/' + key).remove().then(function () {
				$scope.success('Removed Successfully!');
				$scope.safeApply();
				setTimeout(function () {
					$scope.reload();
				}, 1000);
			});
		}
	}
	$scope.exportQuestionDatas = function (key, question, databasename) {
		localStorage.setItem("exportQuestionKey", key);
		localStorage.setItem("exportQuestionsentence", question);
		localStorage.setItem("databasename", databasename);
		setTimeout(function () {
			window.location.href = '../export.html';
		}, 1000);
	}
	$scope.exportAllQuestionDatas = function (dbname) {
		localStorage.setItem("databasename", dbname);
		setTimeout(function () {
			window.location.href = '../exportall.html';
		}, 1000);
	}
	//fileUpload
	$scope.fileupload = function () {

		var uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
			function (c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			})

		var uploader = document.getElementById('uploader');
		var fileButton = document.getElementById('fileButton');
		fileButton.addEventListener('change', function (e) {
			//Get File
			var file = e.target.files[0];
			//Create storage ref
			var storageRef = firebase.storage().ref('img/' + uid)
			//Upload file
			var task = storageRef.put(file);
			$scope.temp_image = uid;
			//Update Progressbar
			task.on('state_changed',
				function progress(snapshot) {
					var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					uploader.value = percentage;
					if (percentage == 100) {
						$scope.success('Success!');
						$scope.safeApply();
					}

				},

			);
		})
	}
	//Load Image
	$scope.imgloaded = false;
	$scope.loadimage = function (key) {
		if (key == 0) var dbname = 'TextQuestions';
		if (key == 1) var dbname = 'DropdownQuestions';
		if (key == 2) var dbname = 'SlideQuestions';
		var questionkey = $scope.questionkey;//localstorage variable,$scope.answerindex is also
		$scope.answers = [];
		var questiondata = firebase.database().ref(dbname + '/' + questionkey);
		questiondata.on('value', function (snapshot) {

			var imgname = snapshot.val()['image'];
			var storageRef = firebase.storage().ref();

			storageRef.child('img/' + imgname).getDownloadURL().then(function (url) {
				document.querySelector('img').src = url;
				console.log(url)
				$scope.imgloaded = true;
				$scope.safeApply();
			}).catch(function (error) { })
		})

		// });
	}
	//Get Question Sets

	$scope.getsets = function () {
		var questionsetName = localStorage.getItem('questionsetName');	
		var qtsets = firebase.database().ref('QuestionSets');
		$scope.QuestionSets = [];
		qtsets.on('value', function (snapshot) {
			var j = 0;
			snapshot.forEach(function (childSnapshot) {
				$scope.QuestionSets[j] = { val: childSnapshot.val(), key: childSnapshot.key };
				if (childSnapshot.val().setname == questionsetName) {
					$scope.questionset = childSnapshot.key;
				};
				j++;
			});
			$scope.safeApply();
		});
	}
});

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
	// 								Join Group functions									|
	//                                                                  					|
	// =====================================================================================|




	//Discriminate
	$scope.discrimination = function () {
		if (!$scope.groupcode) {
			$scope.error("Please input group code!");
			return;
		}
		var groupcode = $scope.groupcode.split("/")[0];
		var teacher_id = $scope.groupcode.split("/")[1];
		if (!teacher_id) {
			$scope.error("Invalid format group code!");
			return;
		}
		var existinggroup = firebase.database().ref('Groups').child(teacher_id).child(groupcode);
		var flag = 0;
		existinggroup.on('value', function (snapshot) {
			const groupChild = snapshot.val();
			if (groupChild) {  // if exists				
				$scope.JoinGroup();
				$scope.safeApply()
			} else {
				$scope.error('Invalid GroupCode!')
				$scope.safeApply()
				return;
			}
		});
	}

	//add group to the student
	$scope.JoinGroup = function () {
		var groupcode = $scope.groupcode.split("/")[0];  //Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('StudentGroups/' + firebase.auth().currentUser.uid);

		storesRef.orderByValue().equalTo(groupcode).once("value", snapshot => {
			const groupChild = snapshot.val();
			if (groupChild) {  // if exists				
				$scope.error("You are alread joined this group.\n please select other group.");
				$scope.safeApply();
			} else {
				var newStoreRef = storesRef.push();//Add record to Question table in fireabse
				newStoreRef.set(groupcode).then(function () {
					$scope.success('Group is saved successfully!')
					$scope.safeApply();
					// 
				})
			}
		});
	}

	// =====================================================================================|
	//                                                                  					|
	// 								Get Group functions									|
	//                                                                  					|
	// =====================================================================================|


	//get student group
	$scope.getStudentGroups = function () {

		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				localStorage.setItem("loginedUserId", uid);
				var groupdata = firebase.database().ref('StudentGroups/' + uid);
				groupdata.on('value', function (snapshot) {
					$scope.studentgroups = [];
					snapshot.forEach(function (childSnapshot) {
						var group_key = childSnapshot.val();
						var groupname = firebase.database().ref('Groups');
						groupname.on('value', function (snapshot) {
							snapshot.forEach(function (namechild) {
								if (namechild.val()[group_key]) {
									$scope.studentgroups.push({
										group_id: group_key,
										groupname: namechild.val()[group_key]['groupname'],
										QuestionSets: namechild.val()[group_key]['QuestionSets'],
									});
									$scope.safeApply();
								}
							});
						});
					});
				});
			} else {
				$scope.error("You need to login!");
			}
		});
	};


	//go to details of student group
	$scope.studentGroupDetails = function (obj) {
		if (obj.QuestionSets == undefined) {
			$scope.error("This group doesn't have Question Set");
			return;
		}
		localStorage.setItem("studentgroupkey", obj.group_id);
		localStorage.setItem("studentgroupname", obj.groupname);
		var setnames = [];
		var setkey = [];
		for (key in obj.QuestionSets) {
			setnames[obj.QuestionSets[key].order] = obj.QuestionSets[key].setname;
			setkey[obj.QuestionSets[key].order] = obj.QuestionSets[key].key;
		}
		localStorage.setItem("studentgroupsetkey", setkey);
		localStorage.setItem("studentgroupsetname", setnames);
		window.location.href = './studentGroupDetail.html';
	}

	//Student group details page load
	$scope.getStudentGroupsDetails = function () {
		$scope.studentgroupkey = localStorage.getItem("studentgroupkey");
		$scope.studentgroupname = localStorage.getItem("studentgroupname");
		var studentgroupsetkey = localStorage.getItem("studentgroupsetkey");
		var studentgroupsetname = localStorage.getItem("studentgroupsetname");


		$scope.studentgroupsetkey = studentgroupsetkey.split(',');
		$scope.studentgroupsetname = studentgroupsetname.split(',');	

		$scope.safeApply()
	}

	$scope.questions = function (key, name) {
		localStorage.setItem("questionsetkey", key);
		localStorage.setItem("questionsetName", name);
		window.location.href = '../question/questions for students.html';
	}

});

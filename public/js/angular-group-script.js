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
	$scope.logout = function () {
		firebase.auth().signOut();
		window.location.href = '../../index.html';
	}


	//   +++++++++++++++++++++++++   Start of Auto complete chips              ++++++++++++++++++++++++++++++++++++++++++++++++
	//   ++++++++++++++++++++++++++++++++++++



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


	//   +++++++++++++++++++++++++   end of Auto complete chips              ++++++++++++++++++++++++++++++++++++++++++++++++
	//   ++++++++++++++++++++++++++++++++++++



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
	$scope.creatQuestionSet = function () {
		if (!$scope.setname) {
			$scope.error("Please insert Question Set name.");
			return;
		}
		var userid = firebase.auth().currentUser.uid;
		var tags = "";
		$scope.selectedTags.forEach(function (tagObj) {
			if (tags == "") {
				tags = tagObj.name;
			} else {
				tags += "," + tagObj.name;
			}
		});

		var Setdetails = { setname: $scope.setname, creator: userid, tags: tags };		//Questions
		
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
					$scope.success('Question Set is created successfully!');
					localStorage.setItem("questionsetName", $scope.setname);
					$scope.safeApply();
					setTimeout(function () {
						window.location.href = '../create question by type.html';
					}, 1000)
				})
			}
		});
	}
	$scope.getgroups = function () {
		setTimeout(function () {
			var uid = firebase.auth().currentUser.uid;
			var groupdata = firebase.database().ref('Groups/' + uid);
			groupdata.on('value', function (snapshot) {
				$scope.groups = [];
				snapshot.forEach(function (childSnapshot) {
					$scope.groups.push({ groupname: childSnapshot.val()['groupname'], key: childSnapshot.key + "/" + uid });
				});
				$scope.safeApply();
			});
		}, 1000)

	}
	$scope.gotoGroupDetails = function (obj) {
		localStorage.setItem("groupkey", obj.key);
		localStorage.setItem("groupname", obj.groupname);
		window.location.href = './groupQuestion.html';
	}
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
		})

	}
	//delete group
	$scope.deletegroup = function (group) {
		var key = group.key.split("/")[0];
		firebase.database().ref('Groups/' + firebase.auth().currentUser.uid + '/' + key).remove().then(function () {
			$scope.success('Removed Successfully!')
			$scope.safeApply()
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

	//Discriminate
	$scope.discrimination = function () {
		var groupcode = $scope.groupcode.split("/")[0];
		var teacher_id = $scope.groupcode.split("/")[1];

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


	//get student group
	$scope.getStudentGroups = function () {

		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var j = 0;
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
		var k = 0;
		for(key in obj.QuestionSets){
			setnames[k] = obj.QuestionSets[key].setname;
			setkey[k] = obj.QuestionSets[key].key;
			k++;
		}
		localStorage.setItem("studentgroupsetkey", setkey);
		localStorage.setItem("studentgroupsetname", setnames);
		setTimeout(function () {
			window.location.href = './studentGroupDetail.html';
		}, 150);
	}
	//Student group details page load
	$scope.getStudentGroupsDetails = function () {
		$scope.studentgroupkey = localStorage.getItem("studentgroupkey");
		$scope.studentgroupname = localStorage.getItem("studentgroupname");
		var studentgroupsetkey = localStorage.getItem("studentgroupsetkey");
		var studentgroupsetname = localStorage.getItem("studentgroupsetname");
		studentgroupsetkey = studentgroupsetkey.split(',')
		studentgroupsetname = studentgroupsetname.split(',')

		$scope.studentgroupsetkey = studentgroupsetkey;
		$scope.studentgroupsetname = studentgroupsetname;
		$scope.safeApply()
	}
	$scope.questions = function (val) {
		localStorage.setItem("questionsetkey", val);
		window.location.href = '../questions for students.html';
	}
});

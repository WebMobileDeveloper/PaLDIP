var app = angular.module('DemoApp', ['ngMaterial','toaster']);
app.controller('MainCtrl', function($scope, toaster) {

	$scope.categories = ['Teacher', 'Student'];
	$scope.feeds = [{type:'Text',value:0},{type:'Scale',value:1},{type:'Scale and Text',value:2}];
	$scope.answerindex= 0;
	$scope.questionplan='';
	$scope.hideindex=false;
	$scope.deletingprogresskey=false;
    $scope.warning = function(msg){
        toaster.pop('warning', "Warning",msg, 3000);
    };
    $scope.success = function(msg){
        toaster.pop('success', "Success", msg, 3000);
    };
    $scope.error = function(msg){
        toaster.pop("error","Error", msg, 3000);
    };
	$scope.info = function(msg){
        toaster.pop("info","info", msg, 3000);
    };
	$scope.reload = function(){
		window.location.reload();
	}
	//this function protecs double of $apply()
	$scope.safeApply = function(fn) {
	  var phase = this.$root.$$phase;
	  if(phase == '$apply' || phase == '$digest') {
		if(fn && (typeof(fn) === 'function')) {
		  fn();
		}
	  } else {
		this.$apply(fn);
	  }
	};
	$scope.logout=function(){
		firebase.auth().signOut();
		window.location.href = '../../index.html';
	}
	$scope.creatgroup=function(){
		var userid=firebase.auth().currentUser.uid;
		var groupdetails = {groupname:$scope.groupname};//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('Groups/'+userid);
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(groupdetails).then(function(){
			$scope.success('Group is created successfully!')
			$scope.safeApply();
			setTimeout(function(){
				$scope.reload()
			},500);
		})
	}
	$scope.creatQuestionSet=function(){
		var userid=firebase.auth().currentUser.uid;
		var Setdetails = {setname:$scope.setname};//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('QuestionSets');
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(Setdetails).then(function(){
			$scope.success('Question Set is created successfully!')
			$scope.safeApply();
			setTimeout(function(){
				$scope.reload()
			},500);
		})
	}
	$scope.getgroups=function(){
		setTimeout(function(){
			var groupdata = firebase.database().ref('Groups/'+firebase.auth().currentUser.uid);
			groupdata.on('value', function(snapshot) {
				$scope.groups=[];
				var j=0;
				snapshot.forEach(function(childSnapshot) {
					$scope.groups[j]={groupname:childSnapshot.val()['groupname'],key:childSnapshot.key}
					j++;
				});
				$scope.safeApply();
			});
			

		},1000)
		
	}
	$scope.gotoGroupDetails=function(obj){
		localStorage.setItem("groupkey", obj.key);
		localStorage.setItem("groupname", obj.groupname);
		window.location.href = './groupQuestion.html';
	}
	//get sets in the group and total set lists
	$scope.getQuesionSets=function(){//
		setTimeout(function(){
			var groupkey=localStorage.getItem("groupkey");
			var setIngroupdata = firebase.database().ref('Groups/'+firebase.auth().currentUser.uid+'/'+groupkey+'/QuestionSets');
			setIngroupdata.on('value', function(snapshot) {
				$scope.setsInGroup=snapshot.val();
				$scope.grouptitle = localStorage.getItem("groupname");
				var setdata = firebase.database().ref('QuestionSets');
				setdata.on('value', function(snapshot) {
					$scope.questionSetLists = [];
					var i=0;
					snapshot.forEach(function(child){
						var exitflag=0;
						try{
							for(var exisindex=0;exisindex<$scope.setsInGroup.length;exisindex++){
								if($scope.setsInGroup[exisindex]['key']==child.key) exitflag=1;
							}
						}catch(e){}
						if(exitflag !=1 )
							$scope.questionSetLists[i]={setname:child.val()['setname'],key:child.key};
						i++;
					})
					
					$scope.safeApply();
				});
			});
		},1000)
		
	}
	//add set to group
	$scope.addtogroup=function(set){
		if(!$scope.setsInGroup) $scope.setsInGroup=[];
		$scope.setsInGroup.push(set);
		$scope.questionSetLists.splice( $scope.questionSetLists.indexOf(set), 1 );
	}
	//remove set from group
	$scope.removefromgroup=function(set){
		$scope.questionSetLists.push(set);
		$scope.setsInGroup.splice( $scope.setsInGroup.indexOf(set), 1 );
	}
	//Function to save Question sets in the group
	$scope.saveGroupSet=function(){
		if($scope.setsInGroup=='')
			alert('Please click set to add!')
		else{
			var rootRef = firebase.database().ref();
			var updates={};
			var uid=firebase.auth().currentUser.uid;
			var groupkey=localStorage.getItem("groupkey");
			updates['/Groups/'+uid+'/'+groupkey+'/QuestionSets']=$scope.setsInGroup;
			

			rootRef.update(updates).then(function(){
				$scope.success('Question Sets are imported successfully!')
				$scope.safeApply();
				setTimeout(function(){
					$scope.reload()
				},500);
			})
		}
	
	}
	//delete group
	$scope.deletegroup=function(group){
		firebase.database().ref('Groups/' + firebase.auth().currentUser.uid+'/'+group.key).remove().then(function(){
			$scope.success('Removed Successfully!')
			$scope.safeApply()
		});
	}
	//add group to the student
	$scope.JoinGroup = function(){
		var groupcode = $scope.groupcode;//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('StudentGroups/' + firebase.auth().currentUser.uid);
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(groupcode).then(function(){
			$scope.success('Group is saved successfully!')
			$scope.safeApply();
			setTimeout(function(){
				$scope.reload()
			},500);
		})
	}
	//Discriminate
	$scope.discrimination=function(){
		var existinggroup = firebase.database().ref('Groups');
		var flag=0;
		existinggroup.on('value', function(snapshot) {
			
			snapshot.forEach(function(childSnapshot) {
				var key=childSnapshot.key;
				var existinggroup = firebase.database().ref('Groups/'+key);
				existinggroup.on('value',function(nextchild){
					nextchild.forEach(function(result) {
						if($scope.groupcode==result.key){
							flag=1;
						}
					})
				})
			});
			setTimeout(function(){
				if(flag==0){
					$scope.error('Invalid GroupCode!')
					$scope.safeApply()
					return;
				}else{
					$scope.JoinGroup();
					$scope.safeApply()
				}

			},2000)
		});
	}
	//get student group
	$scope.getStudentGroups=function(){
		setTimeout(function(){
			$scope.studentgroups=[];
			$scope.studentgroupnames=[];
			$scope.studentgroupQuestionSets=[];
			var j=0;
			var groupdata = firebase.database().ref('StudentGroups/'+firebase.auth().currentUser.uid);
			groupdata.on('value', function(snapshot) {
				snapshot.forEach(function(childSnapshot) {
					$scope.studentgroups[j]=childSnapshot.val()
					//get group name
					var name,QuestionSets;
					var groupname = firebase.database().ref('Groups');
					groupname.on('value', function(snapshot) {
						snapshot.forEach(function(namechild){
							if(namechild.val()[childSnapshot.val()]){
								name=namechild.val()[childSnapshot.val()]['groupname']
								QuestionSets=namechild.val()[childSnapshot.val()]['QuestionSets']
								$scope.safeApply();
								// break;
							} 

						})
					});
					setTimeout(function(){
						$scope.studentgroupnames[j]=name;
						$scope.studentgroupQuestionSets[j]=QuestionSets;
						$scope.safeApply();
						j++;
						
					},1000)
				});
				$scope.safeApply();
			});
		},1000)
	}
	//go to details of student group
	$scope.studentGroupDetails=function(key,name,set){
		console.log(key)
		console.log(name)
		console.log(set)
		if(set==undefined){

			$scope.error("This group doesn't have Question Set");
			return;
		} 
		localStorage.setItem("studentgroupkey", key);
		localStorage.setItem("studentgroupname", name);
		var setnames=[];
		var setkey=[];
		var k=0;
		set.forEach(function(child){
			console.log(child)
			setnames[k]=child.setname;
			setkey[k]=child.key;
			k++
		})


		setTimeout(function(){
			localStorage.setItem("studentgroupsetkey", setkey);
			localStorage.setItem("studentgroupsetname", setnames);
			window.location.href = './studentGroupDetail.html';
		},150);
	}
	//Student group details page load
	$scope.getStudentGroupsDetails=function(){
		$scope.studentgroupkey = localStorage.getItem("studentgroupkey");
		$scope.studentgroupname = localStorage.getItem("studentgroupname");
		var studentgroupsetkey = localStorage.getItem("studentgroupsetkey");
		var studentgroupsetname = localStorage.getItem("studentgroupsetname");
		studentgroupsetkey=studentgroupsetkey.split(',')
		studentgroupsetname=studentgroupsetname.split(',')
		$scope.studentgroupsetkey = studentgroupsetkey;
		$scope.studentgroupsetname = studentgroupsetname;
		$scope.safeApply()
	}
	$scope.questions=function(val){
		console.log(val)
		localStorage.setItem("questionsetkey", val);
		window.location.href = '../questions for students.html';
	}
});

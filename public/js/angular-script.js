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
	
	$scope.submitAnswerDisableKey=false;
	$scope.submitAnswerDisableKey_digit=false;
	$scope.safeApply()
	$scope.questionkey=localStorage.getItem('questionkey');
	$scope.question=localStorage.getItem('question');
	$scope.questiontype=parseInt(localStorage.getItem('qtype'));
	$scope.questiontype2=parseInt(localStorage.getItem('qtype'));
	if($scope.questiontype==2){
		$scope.questiontype2=0
	}
	$scope.feedqts=localStorage.getItem('feedqts');
	$scope.currentmyanswer=localStorage.getItem("currentmyanswer");
	$scope.currentmydigitanswer=localStorage.getItem("currentmydigitanswer");
	$scope.answer=localStorage.getItem("previousanswer");
	$scope.digitanswer=parseFloat(localStorage.getItem("previousdigitanswer"));
	if($scope.answer){
		$scope.submitAnswerDisableKey=true;
	}
	if($scope.digitanswer){
		// alert(localStorage.getItem("previousdigitanswer"))
		$scope.submitAnswerDisableKey_digit=true;
	}
	$scope.progresskey=true;
	$scope.scalescores={};
	//user switch function
	$scope.userswitch=function(val){
		if(val=='Teacher')
			$scope.profilefield=false;
		if(val=='Student')
			$scope.profilefield=true;
	}
	//when click register button-register.html
	//When user click register button, this function is called
	$scope.register = function(){


		if($scope.basicpassword==undefined || $scope.authtype==undefined || $scope.username==undefined){
			$scope.error('Input information correctly!')
			return;
		}
		if($scope.profilefield == true && ($scope.country==undefined || $scope.age==undefined || $scope.gender==undefined || $scope.profession==undefined || $scope.countrylanguage==undefined || $scope.groupcode==undefined)){
			$scope.error('Complete your profile!')
			return;
		}
		if($scope.basicpassword.length<8){
			$scope.warning('Weak Password!')
			return;
		}

		if($scope.authtype=='Student'){
			if($scope.groupcode==undefined || $scope.groupcode==''){
				$scope.error('Input GroupCode!')
					return;
			}
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
						$scope.saveuser();
						$scope.safeApply()
					}

				},2000)
			});
			
		}else{
			$scope.saveuser();
		}
	}

	$scope.saveuser=function(){
		if($scope.basicpassword == $scope.confpassword){
			firebase.auth().createUserWithEmailAndPassword($scope.username,$scope.basicpassword).then(function(user){
					var uid = user.uid;
					if($scope.profilefield == false){
						var data={
							Userkey:uid,
							ID:$scope.username,
							Usertype:$scope.authtype,
							password:$scope.basicpassword,
							approval:0
						}
					}else{
						var data={
							Userkey:uid,
							ID:$scope.username,
							Usertype:$scope.authtype,
							password:$scope.basicpassword,
							country:$scope.country,
							age:$scope.age,
							gender:$scope.gender,
							profession:$scope.profession,
							countrylanguage:$scope.countrylanguage,
						}
					}
					var updates={};
					updates['/Users/'+uid]=data;
					
					firebase.database().ref().update(updates).then(function(){
						if($scope.profilefield == true){
							var groupcode = $scope.groupcode;//Questions
							var rootRef = firebase.database().ref();
							var storesRef = rootRef.child('StudentGroups/' + uid);
							var newStoreRef = storesRef.push();//Add record to Question table in fireabse
							newStoreRef.set(groupcode).then(function(){
								$scope.success('Account Created Successfuly!')
								$scope.safeApply();
								setTimeout(function(){
									window.location.href = '../index.html';
								},100);
							})
						}else{
							$scope.success('Account Created Successfuly!')
							$scope.safeApply();
							setTimeout(function(){
								window.location.href = '../index.html';
							},100);
						}
						
					})


			}).catch(function(error) {
				$scope.error(error.message)
				$scope.safeApply();
			});
		}else{
			$scope.error('Confirm your password correctly!')
			$scope.basicpassword='';
			$scope.confpassword='';
		}
	}
	//when click login button-index.html for login
	$scope.login=function(){
		if($scope.loginmail && $scope.pwd && $scope.usertype){
			
			firebase.auth().signInWithEmailAndPassword($scope.loginmail,$scope.pwd).then(function(user){
				
				var userid=user.uid;
				var starCountRef = firebase.database().ref('Users/' + userid);
				starCountRef.on('value', function(snapshot) {
					var curusertype = snapshot.val().Usertype;
					if(curusertype !='Admin' && $scope.usertype != curusertype){
						firebase.auth().signOut();
						$scope.error('Select your type correctly!')
						$scope.safeApply();
					}else{
						if(curusertype=='Teacher'){
							if(snapshot.val().approval==1)
							// window.location.href = './templates/creat question.html';
								 window.location.href = './templates/teachermain.html';
							 else
							 	$scope.error('You are not approved yet!')
							 $scope.safeApply()
						}
						if(curusertype=='Student')
							window.location.href = './templates/studentmain.html';
						if(curusertype=='Admin')
							window.location.href = './approval.html';
					}
				});
				
			}).catch(function(error) {
				$scope.error(error.message)
				$scope.safeApply();
			});
		}else{
			$scope.warning('Input your information!')
		}
	}
	//this function works when question for students.html and create question file loads. so when students login, questions are displayed.
	//After login, display questions.
	$scope.getqts=function(){
		$scope.questions = [];
		var questionsetkey = localStorage.getItem("questionsetkey");
		var qtdata = firebase.database().ref('Questions').orderByChild("Set").equalTo(questionsetkey);
		qtdata.on('value', function(snapshot) {
			
			snapshot.forEach(function(childSnapshot) {
				var key=childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				if(childData['feedqts']==undefined)
					$scope.questions.push({key:key,value:childData['question'],type:childData['type'],feedqts:[]});
				else//when scale feedback
					$scope.questions.push({key:key,value:childData['question'],type:childData['type'],feedqts:childData['feedqts']});
			});
			$scope.safeApply();
		});
		
	}
	$scope.getqtsteacherside=function(){
		$scope.questions = [];
		var qtdata = firebase.database().ref('Questions');
		qtdata.on('value', function(snapshot) {
			
			snapshot.forEach(function(childSnapshot) {
				var key=childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				if(childData['feedqts']==undefined)
					$scope.questions.push({key:key,value:childData['question'],type:childData['type'],feedqts:[]});
				else//when scale feedback
					$scope.questions.push({key:key,value:childData['question'],type:childData['type'],feedqts:childData['feedqts']});
			});
			$scope.safeApply();
		});
		
	}
	//Get Digit type Questions
	$scope.getdigitqts=function(){
		$scope.questions = [];
		var questionsetkey = localStorage.getItem("questionsetkey");
		var qtdata = firebase.database().ref('DigitQuestions').orderByChild("Set").equalTo(questionsetkey);
		qtdata.on('value', function(snapshot) {
			
			snapshot.forEach(function(childSnapshot) {
				var key=childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				$scope.questions.push({key:key,value:childData['question']});
			});
			$scope.safeApply();
		});
		
	}
	$scope.getdigitqtsteacherside=function(){
		$scope.questions = [];
		var qtdata = firebase.database().ref('DigitQuestions');
		qtdata.on('value', function(snapshot) {
			
			snapshot.forEach(function(childSnapshot) {
				var key=childSnapshot.key
				var childData = childSnapshot.val();
				//when text feedback
				$scope.questions.push({key:key,value:childData['question']});
			});
			$scope.safeApply();
		});
		
	}
	
//################################## Functions for Teacher pages############################################
//-----------------------------------Create and Delete Questions---------------------------------------------------------------------------------------------------------------
	// Create Question function-question details.html
	$scope.creatQuestion=function(){
		//if question doesn't exist, return
		if($scope.mainQuestion=='' || $scope.mainQuestion==undefined){
			$scope.error('Please Input Question!');
			return;
		}
		//if feedback type is not selected, return
		if($scope.feedbacktype==undefined){
			$scope.error('Please Select Feedback Type!');
			return;
		}
		if($scope.questionset==undefined){
			$scope.error('Please Select Question Set!');
			return;
		}
		var feedqts=[];
		//Scale 10 questions
		if($scope.feedqt1)
			feedqts.push($scope.feedqt1);
		if($scope.feedqt2)
			feedqts.push($scope.feedqt2);
		if($scope.feedqt3)
			feedqts.push($scope.feedqt3);
		if($scope.feedqt4)
			feedqts.push($scope.feedqt4);
		if($scope.feedqt5)
			feedqts.push($scope.feedqt5);
		if($scope.feedqt6)
			feedqts.push($scope.feedqt6);
		if($scope.feedqt7)
			feedqts.push($scope.feedqt7);
		if($scope.feedqt8)
			feedqts.push($scope.feedqt8);
		if($scope.feedqt9)
			feedqts.push($scope.feedqt9);
		if($scope.feedqt10)
			feedqts.push($scope.feedqt10);
		//user mail
		var teachermail=firebase.auth().currentUser.email;
		if($scope.temp_image == undefined) $scope.temp_image=''
		var qtdetails = {question:$scope.mainQuestion,type:$scope.feedbacktype,feedqts:feedqts,teacher:teachermail,image:$scope.temp_image,Set:$scope.questionset};//Questions
		var rootRef = firebase.database().ref();
		var storesRef = rootRef.child('Questions');
		var newStoreRef = storesRef.push();//Add record to Question table in fireabse
		newStoreRef.set(qtdetails).then(function(){
			$scope.success('Question is created successfully!')
			$scope.safeApply();
			setTimeout(function(){
				$scope.reload()
			},500);
		})
	}
	
	//Create Digit Question
		$scope.creatDigitQuestion=function(){
			//if question doesn't exist, return
			if($scope.digitQuestion=='' || $scope.digitQuestion==undefined){
				$scope.error('Please Input Question!');
				return;
			}
			if($scope.questionset==undefined){
				$scope.error('Please Select Question Set!');
				return;
			}
			if($scope.temp_image == undefined) $scope.temp_image=''
			//if feedback type is not selected, return
			//user mail
			var teachermail=firebase.auth().currentUser.email;
			var qtdetails = {question:$scope.digitQuestion,teacher:teachermail,image:$scope.temp_image,Set:$scope.questionset};//Questions
			var rootRef = firebase.database().ref();
			var storesRef = rootRef.child('DigitQuestions');
			var newStoreRef = storesRef.push();//Add record to Question table in fireabse
			newStoreRef.set(qtdetails).then(function(){
				$scope.success('Question is created successfully!')
				$scope.safeApply();
				setTimeout(function(){
					$scope.reload()
				},500);
			})
		}
	
	$scope.deletequestion=function(key,index){
		if(confirm('Do you want to delete this question?')){
			$scope.deletingprogresskey=true;
			var i=0;
			firebase.database().ref('Questions/' + key).remove().then(function(){
				try{
					firebase.database().ref('Feedbacks/' + key).remove().then(function(){
						i++;
					});
				}catch(e){
					i++;
				}
				try{
					firebase.database().ref('FeedbackTexts/' + key).remove().then(function(){
						i++;
					});
					
				}catch(e){
					i++;
				}
				try{
					firebase.database().ref('Answers/' + key).remove().then(function(){
						i++;
					});
					
				}catch(e){
					i++;
				}
				$scope.safeApply();
			});
			$scope.success('Removed Successfully!');
			if(i==3){
				$scope.reload();
			}
			setTimeout(function(){
				$scope.safeApply();
				$scope.reload();
			},1000)
		}
	}
	$scope.deletedigitquestion=function(key){
		if(confirm('Do you want to delete this question?')){
			$scope.deletingprogresskey=true;
			firebase.database().ref('DigitQuestions/' + key).remove().then(function(){
				$scope.success('Removed Successfully!');
				$scope.safeApply();
				setTimeout(function(){
					$scope.reload();
				},1000);
			});
		}
	}
	$scope.exportQuestionDatas=function(key,question,dbname){
		localStorage.setItem("exportQuestionKey", key);
		localStorage.setItem("exportQuestionsentence", question);
		localStorage.setItem("databasename", dbname);
		setTimeout(function(){
			window.location.href = '../templates/export.html';
		},1000);
	}
	$scope.exportAllQuestionDatas=function(dbname){
		localStorage.setItem("databasename", dbname);
		setTimeout(function(){
			window.location.href = '../templates/exportall.html';
		},1000);
	}
	$scope.exportQuestionDatas1=function(key,question,dbname){
		localStorage.setItem("exportQuestionKey", key);
		localStorage.setItem("exportQuestionsentence", question);
		localStorage.setItem("databasename", dbname);
		setTimeout(function(){
			window.location.href = '../export.html';
		},1000);
	}
	$scope.exportAllQuestionDatas1=function(dbname){
		localStorage.setItem("databasename", dbname);
		setTimeout(function(){
			window.location.href = '../exportall.html';
		},1000);
	}

/*###########################################################################################################################################################################*/
//################################## Functions for Students pages############################################
	
	//After get questions(from getqts() function), when click one question,set details of it to localstorage
	
	$scope.goSubmitAnswer=function(key,question,qtype,feedqts){
		var myanswer = firebase.database().ref('Answers/'+key+'/answer'+'/'+firebase.auth().currentUser.uid);
		myanswer.on('value', function(snapshot) {
			if(snapshot.val()){
				localStorage.setItem("previousanswer", snapshot.val()['answer']);
			}else{
				localStorage.setItem("previousanswer", '');
			}
		})
		localStorage.setItem("questionkey", key);
		localStorage.setItem("question", question);
		localStorage.setItem("qtype", qtype);
		localStorage.setItem("feedqts", feedqts);
		setTimeout(function(){
			window.location.href = '../templates/screen1.html';
		},1000);
	}
	//save current selected Digit type Question to localstorage
		$scope.goDigitSubmitAnswer=function(key,question){
			var myanswer = firebase.database().ref('DigitAnswers/'+key+'/answer'+'/'+firebase.auth().currentUser.uid);
			myanswer.on('value', function(snapshot) {
				if(snapshot.val()){
					localStorage.setItem("previousdigitanswer", snapshot.val()['answer']);
				}else{
					localStorage.setItem("previousdigitanswer", '');
				}
			})
			localStorage.setItem("questionkey", key);
			localStorage.setItem("question", question);
			setTimeout(function(){
				window.location.href = './submitanswer.html';
			},1000);
		}
	//Submit Answer about selected question
	$scope.saveanswer=function(){
		if($scope.answer == undefined){
			$scope.warning('Please Input your Answer.')
			return;
		}
		if(firebase.auth().currentUser){
			var updates={};
			var currentdate = new Date(); 
			var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
			updates['/Answers/'+$scope.questionkey+'/'+'question']=$scope.question;
			updates['/Answers/'+$scope.questionkey+'/answer/'+firebase.auth().currentUser.uid+'/answer']=$scope.answer;
			updates['/Answers/'+$scope.questionkey+'/answer/'+firebase.auth().currentUser.uid+'/mail']=firebase.auth().currentUser.email;
			updates['/Answers/'+$scope.questionkey+'/answer/'+firebase.auth().currentUser.uid+'/datetime']=datetime;
			$scope.success('Your Answer is Saved Successfully!');
			localStorage.setItem("currentmyanswer",$scope.answer);
			firebase.database().ref().update(updates).then(function(){
				window.location.href = '../templates/screen2.html';
			}).catch(function(error) {
				$scope.error('Submit Error!')
			});
		}else{
			$scope.error('You have to login!');
		}
		
	}
	//Submit Digit Type Answer about selected question
	$scope.savedigitanswer=function(){
		if($scope.digitanswer == undefined){
			$scope.warning('Please Input your Answer.')
			return;
		}
		if(firebase.auth().currentUser){
			var updates={};
			var currentdate = new Date(); 
			var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
			updates['/DigitAnswers/'+$scope.questionkey+'/'+'question']=$scope.question;
			updates['/DigitAnswers/'+$scope.questionkey+'/answer/'+firebase.auth().currentUser.uid+'/answer']=$scope.digitanswer;
			updates['/DigitAnswers/'+$scope.questionkey+'/answer/'+firebase.auth().currentUser.uid+'/mail']=firebase.auth().currentUser.email;
			updates['/DigitAnswers/'+$scope.questionkey+'/answer/'+firebase.auth().currentUser.uid+'/datetime']=datetime;
			$scope.success('Your Answer is Saved Successfully!');
			localStorage.setItem("currentmydigitanswer",$scope.digitanswer);
			firebase.database().ref().update(updates).then(function(){
				window.location.href = './viewClassDigitanswer.html';
			}).catch(function(error) {
				$scope.error('Submit Error!')
			});
		}else{
			$scope.error('You have to login!');
		}
		
	}
	//Get Class Average Answer
		$scope.getclassAverage=function(){
			var sumval=0;
			var i=0;
			var classanswer = firebase.database().ref('DigitAnswers/'+$scope.questionkey+'/answer');
			classanswer.on('value', function(snapshot) {
				snapshot.forEach(function(childSnapshot) {
					sumval +=childSnapshot.val()['answer'];
					i++;
				});
				$scope.averageanswer=(sumval/i).toFixed(1);
				$scope.safeApply()
			})
		}
	//when user submitted answer already, skip save
	$scope.nextpage=function(){
		if(firebase.auth().currentUser){
			var updates={};
			localStorage.setItem("currentmyanswer",$scope.answer);
			window.location.href = '../templates/screen2.html';
		}else{
			$scope.error('You have to login!');
		}
	}
	$scope.nextpage_digit=function(){
		if(firebase.auth().currentUser){
			var updates={};
			localStorage.setItem("currentmydigitanswer",$scope.digitanswer);
			window.location.href = './viewClassDigitanswer.html';
		}else{
			$scope.error('You have to login!');
		}
	}
//******************************Submit Feedback(getanswers,next/previous answer,get stars,getfeedtext),SubmitFeedback******************************//
	
	// this works when screen2.html load. screen2 is "submit feedback" page
	//Get All answers about selected question
	$scope.getanswers=function(){
		var questionkey=$scope.questionkey;//localstorage variable,$scope.answerindex is also
		$scope.answers = [];
		var answers = firebase.database().ref('Answers/'+questionkey+'/answer');
		answers.on('value', function(snapshot) {
			snapshot.forEach(function(childSnapshot) {
				$scope.answers.push({'answerval':childSnapshot.val()['answer'],'answerkey':childSnapshot.key})
				
			});
			$scope.answerplan=$scope.answers[$scope.answerindex].answerval;//To display in screen2,html
			$scope.answerkey=$scope.answers[$scope.answerindex].answerkey;
			// $scope.safeApply();
			$scope.hideindex=true;//hide progressbar in screen2.html
		/*Load Stars and Text feedbacks*/
			var feedscores = firebase.database().ref('Feedbacks/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid);
			feedscores.on('value', function(snapshot) {
				snapshot.forEach(function(childSnapshot) {
					$scope.setstar(childSnapshot.val()-1,childSnapshot.key);// saved stars load
					$scope.safeApply();
				});
			})
			var feedtexts = firebase.database().ref('FeedbackTexts/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid);
			feedtexts.on('value', function(snapshot) {
				$scope.feedbacktext=snapshot.val()
				$scope.safeApply();
			});
			
		/*Load Stars and Text feedbacks*/
				
		});
		
	}
	// This exists for Feedback Questions.
	try{
		$scope.feedbackquestions=$scope.feedqts.split(',')
		if($scope.feedbackquestions !="")
			$scope.scalehide=0;
		else
			$scope.scalehide=1;
	}catch(e){
		
	}
	//When click next answer button( " > " )
	$scope.increaseindex=function(){
		$scope.answerindex++;
		try{
			$scope.answerplan=$scope.answers[$scope.answerindex].answerval;
			$scope.answerkey=$scope.answers[$scope.answerindex].answerkey;
			
			var feedscores = firebase.database().ref('Feedbacks/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid);
			feedscores.on('value', function(snapshot) {
				var i=0;
				snapshot.forEach(function(childSnapshot) {
					$scope.setstar(childSnapshot.val()-1,childSnapshot.key);
				});
				if(snapshot.val()==null){
					$scope.formatstar();
				}
				$scope.safeApply();
			});
			var feedtexts = firebase.database().ref('FeedbackTexts/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid);
			feedtexts.on('value', function(snapshot) {
				$scope.feedbacktext=snapshot.val()
				$scope.safeApply();
			});
				
		}catch(e){
			$scope.info('This is last Answer.')
			$scope.answerindex--;
		}
	}
	//When click previous answer button( " < " )
	$scope.decreaseindex=function(){
		$scope.answerindex--;
		if($scope.answerindex <0){
			$scope.info('This is first Answer.')
			$scope.answerindex=0;
		}
		else{
			$scope.answerplan=$scope.answers[$scope.answerindex].answerval;
			$scope.answerkey=$scope.answers[$scope.answerindex].answerkey;
			var feedscores = firebase.database().ref('Feedbacks/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid);
			feedscores.on('value', function(snapshot) {
				var i=0;
				snapshot.forEach(function(childSnapshot) {
					$scope.setstar(childSnapshot.val()-1,childSnapshot.key);
				});
				$scope.safeApply();
				if(snapshot.val()==null){
					$scope.formatstar();
				}
			});
			var feedtexts = firebase.database().ref('FeedbackTexts/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid);
			feedtexts.on('value', function(snapshot) {
				$scope.feedbacktext=snapshot.val()
				$scope.safeApply();
			});
				
		}
	}
	//When load answer or click star, set stars
	$scope.setstar=function(index,rowindex){
		var catchedrow = $('.starfield div .starrow')[rowindex];
		var fivestars = $(catchedrow)[0].children;
		for(var i=index;i>=0;i--){
			$(fivestars)[i].classList.add('checked');
		}
		for(var i=index+1;i<5;i++){
			$(fivestars)[i].classList.remove('checked');
		}
		$scope.scalescores[rowindex]=index+1
	}
	//formart scales-about five stars
	$scope.formatstar=function(){
		$scope.scalescores={};
		for(var j=-1;j<10;j++){
			try{
				var catchedrow = $('.starfield div .starrow')[j];
				var fivestars = $(catchedrow)[0].children;
				for(var i=0;i<5;i++){
					$(fivestars)[i].classList.remove('checked');
				}
				
			}catch(e){}
		}
	}
	// submit stars and text feedback
	$scope.submitfeedback=function(){
		// if(!$scope.scalescores==null)
		if($scope.questiontype==1){//type==scale
			if(firebase.auth().currentUser.uid){
				var updates={};
				updates['/Feedbacks/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid]=$scope.scalescores;
				$scope.success('Your feedback is submitted Successfully!');
				firebase.database().ref().update(updates).then(function(){
				}).catch(function(error) {
					$scope.error('Submit Error!')
				});
			}
		}else if($scope.questiontype==0){//scale==text
			var updates={};
			updates['/FeedbackTexts/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid]=$scope.feedbacktext;
			firebase.database().ref().update(updates).then(function(){
				$scope.feedbacktext='';
				$scope.success('Your feedback is submitted Successfully!');
				$scope.safeApply();
			}).catch(function(error) {
				$scope.error('Submit Error!')
			});
		}else if($scope.questiontype==2){//scale==both
			var updates={};
			updates['/Feedbacks/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid]=$scope.scalescores;
			firebase.database().ref().update(updates).then(function(){
				var updates2={};
				updates2['/FeedbackTexts/'+$scope.questionkey+'/'+$scope.answerkey+'/'+firebase.auth().currentUser.uid]=$scope.feedbacktext;
				firebase.database().ref().update(updates2).then(function(){
					$scope.success('Your feedback is submitted Successfully!');
					$scope.feedbacktext='';
					$scope.safeApply();
				}).catch(function(error) {
					$scope.error('Submit Error!')
					$scope.safeApply();
				});
			}).catch(function(error) {
				$scope.error('Submit Error!')
			});
		}
	}
//******************************Feedback Views******************************//
	$scope.myfeedbackscore=function(){
		$scope.viewfeedbtn=true;
		if($scope.questiontype==1){
			var countfeeds=$scope.feedbackquestions.length;
			$scope.tscores=[];
			setTimeout(function(){
				var totalsocre = firebase.database().ref('Feedbacks/'+$scope.questionkey+'/'+firebase.auth().currentUser.uid);
				var j=0;
				totalsocre.on('value', function(snapshot) {
					snapshot.forEach(function(childSnapshot) {
						j++;
						for(var i=0;i<countfeeds;i++){
							if(!parseInt(childSnapshot.val()[i])){
								continue;
							}
							else{
								if(!parseInt($scope.tscores[i]))
									$scope.tscores[i]=0;
								$scope.tscores[i]=parseInt(childSnapshot.val()[i])+parseInt($scope.tscores[i]);
							}
						}
					});
				});
				setTimeout(function(){
					$scope.settotalstar($scope.tscores,j);
				},2000)
			},1000);
		}else if($scope.questiontype==0){
			setTimeout(function(){
				var totalfeedtexts = firebase.database().ref('FeedbackTexts/'+$scope.questionkey+'/'+firebase.auth().currentUser.uid);
				var texts=[];
				totalfeedtexts.on('value', function(snapshot) {
					var j=0;
					snapshot.forEach(function(childSnapshot) {
						texts[j]=childSnapshot.val();
						j++;
					});
					$scope.feedtextlimit=j-1;
					$scope.texts=texts;
					$scope.feedindex=0;
					$scope.progresskey=false;
					$scope.viewfeedbtn=false;
					$scope.safeApply()
				});
			},1000);
		}else if($scope.questiontype==2){
			setTimeout(function(){
				if(firebase.auth().currentUser==null){
					$scope.error('You have to login.');
					return;
				} 
				var uid=firebase.auth().currentUser.uid;
				var totalfeedtexts = firebase.database().ref('FeedbackTexts/'+$scope.questionkey+'/'+uid);
				var texts=[];
				totalfeedtexts.on('value', function(txtsnapshot) {
					var j=0;
					txtsnapshot.forEach(function(txtchildSnapshot) {
						texts[j]=txtchildSnapshot.val();
						j++;
					});
					$scope.feedtextlimit=j-1;
					$scope.texts=texts;
					$scope.feedindex=0;
					$scope.safeApply()
				});
				var countfeeds=$scope.feedbackquestions.length;
				$scope.tscores=[];
				var totalsocre = firebase.database().ref('Feedbacks/'+$scope.questionkey+'/'+uid);
				var scoreindex=0;
				totalsocre.on('value', function(snapshot) {
					snapshot.forEach(function(childSnapshot) {
						scoreindex++;
						for(var i=0;i<countfeeds;i++){
							if(!parseInt(childSnapshot.val()[i])){
								continue;
							}
							else{
								if(!parseInt($scope.tscores[i]))
									$scope.tscores[i]=0;
								$scope.tscores[i]=parseInt(childSnapshot.val()[i])+parseInt($scope.tscores[i]);
							}
						}
					});
					$scope.settotalstar($scope.tscores,scoreindex);
				});
			},1000);
		}
	}
	$scope.nextfeedtxt=function(){
		if($scope.feedindex<$scope.feedtextlimit)
			$scope.feedindex++;
		else
			$scope.info('This is last feedback!');
	}
	$scope.previousfeedtxt=function(){
		if($scope.feedindex>0)
			$scope.feedindex--;
		else
			$scope.info('This is first feedback!');
	}
//to view my score
	$scope.settotalstar=function(vals,cntperson){
		var scores=[];
		for(var i=0;i<vals.length;i++){
			scores[i]=(vals[i]/cntperson).toFixed(1);
		}
		setTimeout(function(){
			if(i==(vals.length)){
				$scope.resultscore=scores;
				$scope.progresskey=false;
				$scope.viewfeedbtn=false;
				$scope.safeApply()
			}else{
				setTimeout(function(){
					if(i==(vals.length)){
						$scope.resultscore=scores;
						$scope.progresskey=false;
						$scope.viewfeedbtn=false;
						$scope.safeApply()
					}else{
						setTimeout(function(){
							if(i==(vals.length)){
								$scope.resultscore=scores;
								$scope.progresskey=false;
								$scope.viewfeedbtn=false;
								$scope.safeApply()
							}else{
								$scope.error("Internet Connection Problem!")
							}
						},2000)
					}
				},2000)
			}
		},1000)
	}
//fileUpload
	$scope.fileupload=function(){

		var uid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
			function(c) {  
			    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			    return v.toString(16);
			})

		var uploader = document.getElementById('uploader');
		var fileButton = document.getElementById('fileButton');
		fileButton.addEventListener('change',function(e){
			//Get File
			var file=e.target.files[0];
			//Create storage ref
			var storageRef=firebase.storage().ref('img/'+uid)
			//Upload file
			var task = storageRef.put(file);
			$scope.temp_image=uid;
			//Update Progressbar
			task.on('state_changed',
				function progress(snapshot){
					var percentage =  (snapshot.bytesTransferred/snapshot.totalBytes)*100;
					uploader.value = percentage;
					if(percentage==100) {
						$scope.success('Success!');
						$scope.safeApply();
					}
					
				},

			);
		})
	}
//Load Image
	$scope.imgloaded=false;
	$scope.loadimage=function(key){
		if(key==0) var dbname='Questions';
		if(key==1) var dbname='DigitQuestions';
		var questionkey=$scope.questionkey;//localstorage variable,$scope.answerindex is also
		$scope.answers = [];
		var questiondata = firebase.database().ref(dbname+'/'+questionkey);
		questiondata.on('value', function(snapshot) {
			
			var imgname=snapshot.val()['image'];
			var storageRef = firebase.storage().ref();

			storageRef.child('img/'+imgname).getDownloadURL().then(function(url) {
				document.querySelector('img').src = url;
				$scope.imgloaded=true;
				$scope.safeApply();
			}).catch(function(error) {})
		})

		// });
	}
//Get Registered Teachers
	$scope.getRegisteredTeachers=function(){
		var usertypekey='';	
		setTimeout(function(){
		
			var loggedinuser = firebase.database().ref('Users/'+firebase.auth().currentUser.uid);
			loggedinuser.on('value', function(snapshot) {
				usertypekey=snapshot.val()['Usertype'];
			})
			setTimeout(function(){
				if(usertypekey !='Admin'){
					firebase.auth().signOut();
					window.location.href = './index.html';
				}
				var questiondata = firebase.database().ref('Users');
				$scope.registeredTeachersMail=[];
				$scope.hidekey=[];
				$scope.teacherInformations=[];
				var i=0;
				questiondata.on('value', function(snapshot) {
					snapshot.forEach(function(childsnapshot){
						if(childsnapshot.val()['Usertype']=='Teacher'){
							$scope.teacherInformations[i]=childsnapshot.val();
							$scope.registeredTeachersMail[i]=childsnapshot.val()['ID'];
							$scope.hidekey[i]=childsnapshot.val()['approval'];
							i++;
						}
						$scope.safeApply()
					})
					
				})
			},2000)
		},1500)
	}
//logout	
	$scope.logout=function(){
		firebase.auth().signOut();
		window.location.href = '../index.html';
	}
	$scope.logout1=function(){
		firebase.auth().signOut();
		window.location.href = '../../index.html';
	}
	$scope.resetpwd=function(){
		if($scope.requestmail== undefined || $scope.requestmail=='')
			$scope.warning('Please Input your mail!')
		else{
			var email=$scope.requestmail;
			firebase.auth().sendPasswordResetEmail(email).then(function(){
				$scope.requestmail='';
				$scope.info('Password Reset Email Sent!');
				$scope.safeApply()
			}).catch(function(error){
				var errorMessage = error.message;
				$scope.error(errorMessage)
				$scope.safeApply()
			})
		}

	}
	//Get Question Sets
	$scope.getsets=function(){
		var qtsets = firebase.database().ref('QuestionSets');
		$scope.QuestionSets=[];
		qtsets.on('value', function(snapshot) {
			var j=0;
			snapshot.forEach(function(childSnapshot) {
				$scope.QuestionSets[j]={val:childSnapshot.val(),key:childSnapshot.key}
				j++;
			});
			$scope.safeApply()
		});
	}
	// if(firebase.auth().currentUser==null)
	// 	$scope.logout()
	$scope.hidefield=0;
	$scope.enableTeacher=function(obj){
		$scope.hidefield=1;
		var userkey=obj['Userkey']
		var updates={};
		updates['/Users/'+userkey+'/approval']=1;
		firebase.database().ref().update(updates).then(function(){
			$scope.success('User Enabled')
			$scope.safeApply()
			setTimeout(function(){
				window.location.reload();
			},500);
			
		})

	}
	$scope.disableTeacher=function(obj){
		$scope.hidefield=1;
		var userkey=obj['Userkey']
		var updates={};
		updates['/Users/'+userkey+'/approval']=0;
		firebase.database().ref().update(updates).then(function(){
			$scope.warning('User Disabled')
			$scope.safeApply()
			setTimeout(function(){
				window.location.reload();
			},500);
			
		})
		
	}
///////////////////////////////////////////////////////- Country Languages-///////////////////////////////////////////////////////////////////////////////////////////////
	$scope.countries = [ 
		{name: 'Afghanistan', code: 'AF'},
		{name: 'Åland Islands', code: 'AX'},
		{name: 'Albania', code: 'AL'},
		{name: 'Algeria', code: 'DZ'},
		{name: 'American Samoa', code: 'AS'},
		{name: 'Andorra', code: 'AD'},
		{name: 'Angola', code: 'AO'},
		{name: 'Anguilla', code: 'AI'},
		{name: 'Antarctica', code: 'AQ'},
		{name: 'Antigua and Barbuda', code: 'AG'},
		{name: 'Argentina', code: 'AR'},
		{name: 'Armenia', code: 'AM'},
		{name: 'Aruba', code: 'AW'},
		{name: 'Australia', code: 'AU'},
		{name: 'Austria', code: 'AT'},
		{name: 'Azerbaijan', code: 'AZ'},
		{name: 'Bahamas', code: 'BS'},
		{name: 'Bahrain', code: 'BH'},
		{name: 'Bangladesh', code: 'BD'},
		{name: 'Barbados', code: 'BB'},
		{name: 'Belarus', code: 'BY'},
		{name: 'Belgium', code: 'BE'},
		{name: 'Belize', code: 'BZ'},
		{name: 'Benin', code: 'BJ'},
		{name: 'Bermuda', code: 'BM'},
		{name: 'Bhutan', code: 'BT'},
		{name: 'Bolivia', code: 'BO'},
		{name: 'Bosnia and Herzegovina', code: 'BA'},
		{name: 'Botswana', code: 'BW'},
		{name: 'Bouvet Island', code: 'BV'},
		{name: 'Brazil', code: 'BR'},
		{name: 'British Indian Ocean Territory', code: 'IO'},
		{name: 'Brunei Darussalam', code: 'BN'},
		{name: 'Bulgaria', code: 'BG'},
		{name: 'Burkina Faso', code: 'BF'},
		{name: 'Burundi', code: 'BI'},
		{name: 'Cambodia', code: 'KH'},
		{name: 'Cameroon', code: 'CM'},
		{name: 'Canada', code: 'CA'},
		{name: 'Cape Verde', code: 'CV'},
		{name: 'Cayman Islands', code: 'KY'},
		{name: 'Central African Republic', code: 'CF'},
		{name: 'Chad', code: 'TD'},
		{name: 'Chile', code: 'CL'},
		{name: 'China', code: 'CN'},
		{name: 'Christmas Island', code: 'CX'},
		{name: 'Cocos (Keeling) Islands', code: 'CC'},
		{name: 'Colombia', code: 'CO'},
		{name: 'Comoros', code: 'KM'},
		{name: 'Congo', code: 'CG'},
		{name: 'Congo, The Democratic Republic of the', code: 'CD'},
		{name: 'Cook Islands', code: 'CK'},
		{name: 'Costa Rica', code: 'CR'},
		{name: 'Cote D\'Ivoire', code: 'CI'},
		{name: 'Croatia', code: 'HR'},
		{name: 'Cuba', code: 'CU'},
		{name: 'Cyprus', code: 'CY'},
		{name: 'Czech Republic', code: 'CZ'},
		{name: 'Denmark', code: 'DK'},
		{name: 'Djibouti', code: 'DJ'},
		{name: 'Dominica', code: 'DM'},
		{name: 'Dominican Republic', code: 'DO'},
		{name: 'Ecuador', code: 'EC'},
		{name: 'Egypt', code: 'EG'},
		{name: 'El Salvador', code: 'SV'},
		{name: 'Equatorial Guinea', code: 'GQ'},
		{name: 'Eritrea', code: 'ER'},
		{name: 'Estonia', code: 'EE'},
		{name: 'Ethiopia', code: 'ET'},
		{name: 'Falkland Islands (Malvinas)', code: 'FK'},
		{name: 'Faroe Islands', code: 'FO'},
		{name: 'Fiji', code: 'FJ'},
		{name: 'Finland', code: 'FI'},
		{name: 'France', code: 'FR'},
		{name: 'French Guiana', code: 'GF'},
		{name: 'French Polynesia', code: 'PF'},
		{name: 'French Southern Territories', code: 'TF'},
		{name: 'Gabon', code: 'GA'},
		{name: 'Gambia', code: 'GM'},
		{name: 'Georgia', code: 'GE'},
		{name: 'Germany', code: 'DE'},
		{name: 'Ghana', code: 'GH'},
		{name: 'Gibraltar', code: 'GI'},
		{name: 'Greece', code: 'GR'},
		{name: 'Greenland', code: 'GL'},
		{name: 'Grenada', code: 'GD'},
		{name: 'Guadeloupe', code: 'GP'},
		{name: 'Guam', code: 'GU'},
		{name: 'Guatemala', code: 'GT'},
		{name: 'Guernsey', code: 'GG'},
		{name: 'Guinea', code: 'GN'},
		{name: 'Guinea-Bissau', code: 'GW'},
		{name: 'Guyana', code: 'GY'},
		{name: 'Haiti', code: 'HT'},
		{name: 'Heard Island and Mcdonald Islands', code: 'HM'},
		{name: 'Holy See (Vatican City State)', code: 'VA'},
		{name: 'Honduras', code: 'HN'},
		{name: 'Hong Kong', code: 'HK'},
		{name: 'Hungary', code: 'HU'},
		{name: 'Iceland', code: 'IS'},
		{name: 'India', code: 'IN'},
		{name: 'Indonesia', code: 'ID'},
		{name: 'Iran, Islamic Republic Of', code: 'IR'},
		{name: 'Iraq', code: 'IQ'},
		{name: 'Ireland', code: 'IE'},
		{name: 'Isle of Man', code: 'IM'},
		{name: 'Israel', code: 'IL'},
		{name: 'Italy', code: 'IT'},
		{name: 'Jamaica', code: 'JM'},
		{name: 'Japan', code: 'JP'},
		{name: 'Jersey', code: 'JE'},
		{name: 'Jordan', code: 'JO'},
		{name: 'Kazakhstan', code: 'KZ'},
		{name: 'Kenya', code: 'KE'},
		{name: 'Kiribati', code: 'KI'},
		{name: 'Korea, Democratic People\'s Republic of', code: 'KP'},
		{name: 'Korea, Republic of', code: 'KR'},
		{name: 'Kuwait', code: 'KW'},
		{name: 'Kyrgyzstan', code: 'KG'},
		{name: 'Lao People\'s Democratic Republic', code: 'LA'},
		{name: 'Latvia', code: 'LV'},
		{name: 'Lebanon', code: 'LB'},
		{name: 'Lesotho', code: 'LS'},
		{name: 'Liberia', code: 'LR'},
		{name: 'Libyan Arab Jamahiriya', code: 'LY'},
		{name: 'Liechtenstein', code: 'LI'},
		{name: 'Lithuania', code: 'LT'},
		{name: 'Luxembourg', code: 'LU'},
		{name: 'Macao', code: 'MO'},
		{name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'},
		{name: 'Madagascar', code: 'MG'},
		{name: 'Malawi', code: 'MW'},
		{name: 'Malaysia', code: 'MY'},
		{name: 'Maldives', code: 'MV'},
		{name: 'Mali', code: 'ML'},
		{name: 'Malta', code: 'MT'},
		{name: 'Marshall Islands', code: 'MH'},
		{name: 'Martinique', code: 'MQ'},
		{name: 'Mauritania', code: 'MR'},
		{name: 'Mauritius', code: 'MU'},
		{name: 'Mayotte', code: 'YT'},
		{name: 'Mexico', code: 'MX'},
		{name: 'Micronesia, Federated States of', code: 'FM'},
		{name: 'Moldova, Republic of', code: 'MD'},
		{name: 'Monaco', code: 'MC'},
		{name: 'Mongolia', code: 'MN'},
		{name: 'Montserrat', code: 'MS'},
		{name: 'Morocco', code: 'MA'},
		{name: 'Mozambique', code: 'MZ'},
		{name: 'Myanmar', code: 'MM'},
		{name: 'Namibia', code: 'NA'},
		{name: 'Nauru', code: 'NR'},
		{name: 'Nepal', code: 'NP'},
		{name: 'Netherlands', code: 'NL'},
		{name: 'Netherlands Antilles', code: 'AN'},
		{name: 'New Caledonia', code: 'NC'},
		{name: 'New Zealand', code: 'NZ'},
		{name: 'Nicaragua', code: 'NI'},
		{name: 'Niger', code: 'NE'},
		{name: 'Nigeria', code: 'NG'},
		{name: 'Niue', code: 'NU'},
		{name: 'Norfolk Island', code: 'NF'},
		{name: 'Northern Mariana Islands', code: 'MP'},
		{name: 'Norway', code: 'NO'},
		{name: 'Oman', code: 'OM'},
		{name: 'Pakistan', code: 'PK'},
		{name: 'Palau', code: 'PW'},
		{name: 'Palestinian Territory, Occupied', code: 'PS'},
		{name: 'Panama', code: 'PA'},
		{name: 'Papua New Guinea', code: 'PG'},
		{name: 'Paraguay', code: 'PY'},
		{name: 'Peru', code: 'PE'},
		{name: 'Philippines', code: 'PH'},
		{name: 'Pitcairn', code: 'PN'},
		{name: 'Poland', code: 'PL'},
		{name: 'Portugal', code: 'PT'},
		{name: 'Puerto Rico', code: 'PR'},
		{name: 'Qatar', code: 'QA'},
		{name: 'Reunion', code: 'RE'},
		{name: 'Romania', code: 'RO'},
		{name: 'Russian Federation', code: 'RU'},
		{name: 'Rwanda', code: 'RW'},
		{name: 'Saint Helena', code: 'SH'},
		{name: 'Saint Kitts and Nevis', code: 'KN'},
		{name: 'Saint Lucia', code: 'LC'},
		{name: 'Saint Pierre and Miquelon', code: 'PM'},
		{name: 'Saint Vincent and the Grenadines', code: 'VC'},
		{name: 'Samoa', code: 'WS'},
		{name: 'San Marino', code: 'SM'},
		{name: 'Sao Tome and Principe', code: 'ST'},
		{name: 'Saudi Arabia', code: 'SA'},
		{name: 'Senegal', code: 'SN'},
		{name: 'Serbia and Montenegro', code: 'CS'},
		{name: 'Seychelles', code: 'SC'},
		{name: 'Sierra Leone', code: 'SL'},
		{name: 'Singapore', code: 'SG'},
		{name: 'Slovakia', code: 'SK'},
		{name: 'Slovenia', code: 'SI'},
		{name: 'Solomon Islands', code: 'SB'},
		{name: 'Somalia', code: 'SO'},
		{name: 'South Africa', code: 'ZA'},
		{name: 'South Georgia and the South Sandwich Islands', code: 'GS'},
		{name: 'Spain', code: 'ES'},
		{name: 'Sri Lanka', code: 'LK'},
		{name: 'Sudan', code: 'SD'},
		{name: 'Suriname', code: 'SR'},
		{name: 'Svalbard and Jan Mayen', code: 'SJ'},
		{name: 'Swaziland', code: 'SZ'},
		{name: 'Sweden', code: 'SE'},
		{name: 'Switzerland', code: 'CH'},
		{name: 'Syrian Arab Republic', code: 'SY'},
		{name: 'Taiwan, Province of China', code: 'TW'},
		{name: 'Tajikistan', code: 'TJ'},
		{name: 'Tanzania, United Republic of', code: 'TZ'},
		{name: 'Thailand', code: 'TH'},
		{name: 'Timor-Leste', code: 'TL'},
		{name: 'Togo', code: 'TG'},
		{name: 'Tokelau', code: 'TK'},
		{name: 'Tonga', code: 'TO'},
		{name: 'Trinidad and Tobago', code: 'TT'},
		{name: 'Tunisia', code: 'TN'},
		{name: 'Turkey', code: 'TR'},
		{name: 'Turkmenistan', code: 'TM'},
		{name: 'Turks and Caicos Islands', code: 'TC'},
		{name: 'Tuvalu', code: 'TV'},
		{name: 'Uganda', code: 'UG'},
		{name: 'Ukraine', code: 'UA'},
		{name: 'United Arab Emirates', code: 'AE'},
		{name: 'United Kingdom', code: 'GB'},
		{name: 'United States', code: 'US'},
		{name: 'United States Minor Outlying Islands', code: 'UM'},
		{name: 'Uruguay', code: 'UY'},
		{name: 'Uzbekistan', code: 'UZ'},
		{name: 'Vanuatu', code: 'VU'},
		{name: 'Venezuela', code: 'VE'},
		{name: 'Vietnam', code: 'VN'},
		{name: 'Virgin Islands, British', code: 'VG'},
		{name: 'Virgin Islands, U.S.', code: 'VI'},
		{name: 'Wallis and Futuna', code: 'WF'},
		{name: 'Western Sahara', code: 'EH'},
		{name: 'Yemen', code: 'YE'},
		{name: 'Zambia', code: 'ZM'},
		{name: 'Zimbabwe', code: 'ZW'}
	  ];
});

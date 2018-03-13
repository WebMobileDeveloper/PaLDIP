var app = angular.module('DemoApp', ['ngMaterial','toaster']);
app.factory('Excel',function($window){
	var uri='data:application/vnd.ms-excel;base64,',
		template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
		base64=function(s){return $window.btoa(unescape(encodeURIComponent(s)));},
		format=function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
	return {
		tableToExcel:function(tableId,worksheetName){
			var table=$(tableId),
				ctx={worksheet:worksheetName,table:table.html()},
				href=uri+base64(format(template,ctx));
			return href;
		}
	};
})
app.controller('MainCtrl', function($scope, toaster,Excel,$timeout) {

	  $scope.exportToExcel=function(tableId){ // ex: '#my-table'
			$scope.exportHref=Excel.tableToExcel(tableId,'sheet name');
			$timeout(function(){location.href=$scope.exportHref;},100); // trigger download
		}
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
//logout	
	$scope.logout=function(){
		firebase.auth().signOut();
		window.location.href = '../index.html';
	}
	
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
	$scope.initExport=function(){
		$scope.hidefeedfield=true;
		var exportQuestionKey=localStorage.getItem("exportQuestionKey");
		$scope.exportQuestionsentence=localStorage.getItem("exportQuestionsentence");
		$scope.databasename=localStorage.getItem("databasename");
		$scope.lodingfinished=false;
		setTimeout(function(){
			var currentuser=firebase.auth().currentUser;
			if(currentuser==null){
				$scope.error('Network Problem!')
				setTimeout(function(){
					$scope.logout()
				},1000);
			}
			$scope.getAnswers(exportQuestionKey)
			$scope.lodingfinished=true;$scope.safeApply();
		},1000)
		
	}

	

	$scope.getAnswers=function(exportQuestionKey){
		$scope.answers=[];
		var answers = firebase.database().ref($scope.databasename+'/'+exportQuestionKey+'/answer');
		answers.on('value', function(snapshot) {
			$scope.feedtextlimit=0;
			var resultaverage;
			snapshot.forEach(function(childSnapshot) {
				var answerkey=childSnapshot.key;
			//Get Feedback Texts and max count
				if($scope.databasename!='Answers'){
					$(".detachingfield").detach();
				}
				if($scope.databasename=='Answers'){
					$scope.hidefeedfield=false;
					var totalfeedtexts = firebase.database().ref('FeedbackTexts/'+exportQuestionKey+'/'+answerkey);
					var texts=[];
					$scope.thcols=[];
					totalfeedtexts.on('value', function(snapshot) {
						var j=0;
						if(!snapshot.val()){
							texts[j]='';
							j++;
						}else{
							snapshot.forEach(function(feedsnap) {
								texts[j]=feedsnap.val();
								j++;
							});
						}
						if(j>$scope.feedtextlimit)
							$scope.feedtextlimit=j;
						$scope.texts=texts;
					});
				//Get Average score
					var totalsumscore=0;
					var countscore=0;
					var totalsocre = firebase.database().ref('Feedbacks/'+exportQuestionKey+'/'+answerkey);
					totalsocre.on('value', function(snapshot1) {
						snapshot1.forEach(function(childSnapshot) {
							for(var t=0;t<childSnapshot.val().length;t++){
								totalsumscore+=childSnapshot.val()[t]
								countscore++;
							}
						});
					});
				}
			
			//GetUser's Profile
				var userProfile = firebase.database().ref('Users/'+answerkey);
				var profileinformation;
				$scope.profileinformation=[];
				userProfile.on('value', function(snapshot) {
					profileinformation=snapshot.val();
					// console.log(snapshot.val())
				});
			//Combination
				setTimeout(function(){
					if(countscore==0 || totalsumscore==0)resultaverage=0;
					else{
						 resultaverage=(totalsumscore/countscore).toFixed(1);
					} 
					setTimeout(function(){
						for(var k=0;k<$scope.feedtextlimit;k++){
							$scope.thcols[k]='1';
						}
						$scope.answers.push({'mail':childSnapshot.val()['mail'],'answer':childSnapshot.val()['answer'],'datetime':childSnapshot.val()['datetime'],'feedtxt':texts,'averagescore':resultaverage,'Country':profileinformation.country,'Gender':profileinformation.gender,'Profession':profileinformation.profession,'Age':profileinformation.age,'Mothertongue':profileinformation.countrylanguage,'Groupcode':profileinformation.groupcode})
						console.log($scope.answers)
						$scope.safeApply();
					},2000);
				},1000)
				
				
				
				
			});
		})
	}

	$scope.initExportAll=function(){
		$scope.hidefeedfield=true;
		$scope.databasename=localStorage.getItem("databasename");
		$scope.lodingfinished=false;
		setTimeout(function(){
			var currentuser=firebase.auth().currentUser;
			if(currentuser==null){
				$scope.error('Network Problem!')
				setTimeout(function(){
					$scope.logout()
				},1000);
			}
			$scope.getAllAnswers()
			$scope.lodingfinished=true;$scope.safeApply();
		},1000)
	}
	$scope.getAllAnswers=function(){
		$scope.answers=[];
		var questions = firebase.database().ref($scope.databasename);
		questions.on('value', function(snapshot) {
			snapshot.forEach(function(childSnapshot) {
				var exportQuestionKey=childSnapshot.key;
				
				$scope.getAnswers(exportQuestionKey)
				
			});
		})
	}
});
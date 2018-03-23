var app = angular.module('DemoApp', ['ngMaterial', 'toaster']);
app.factory('Excel', function ($window) {
    var uri = 'data:application/vnd.ms-excel;base64,',
        template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
        base64 = function (s) { return $window.btoa(unescape(encodeURIComponent(s))); },
        format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };
    return {
        tableToExcel: function (tableId, worksheetName) {
            var table = $(tableId),
                ctx = { worksheet: worksheetName, table: table.html() },
                href = uri + base64(format(template, ctx));
            return href;
        }
    };
});
app.controller('MainCtrl', function ($scope, toaster, Excel, $timeout) {

    $scope.categories = ['Teacher', 'Student'];
    $scope.feeds = [{ type: 'Text', value: 0 }, { type: 'Scale', value: 1 }, { type: 'Scale and Text', value: 2 }];
    $scope.answerindex = 0;
    $scope.questionplan = '';
    $scope.hideindex = false;
    $scope.deletingprogresskey = false;
    $scope.feedtextlimit = 0;

    $scope.exportToExcel = function (tableId) { // ex: '#my-table'
        $scope.exportHref = Excel.tableToExcel(tableId, 'sheet name');
        $timeout(function () { location.href = $scope.exportHref; }, 100); // trigger download
    }
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
    // 								create Question functions									|
    //                                                                  					|
    // =====================================================================================|


    //Get Question Sets
    $scope.getsets = function () {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                var questionsetName = localStorage.getItem('questionsetName');
                var qtsets = firebase.database().ref('QuestionSets');
                qtsets.on('value', function (snapshot) {
                    $scope.QuestionSets = [];
                    var j = 0;
                    snapshot.forEach(function (childSnapshot) {
                        $scope.QuestionSets[j] = { val: childSnapshot.val(), key: childSnapshot.key }
                        if (childSnapshot.val().setname == questionsetName) {
                            $scope.questionset = childSnapshot.key;
                        };
                        j++;
                    });
                    $scope.safeApply()
                });
            } else {
                $scope.error("You need to login!");
            }
        });
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


    //  create feedback type question
    $scope.creatQuestion = function () {
        //if question doesn't exist, return
        if ($scope.mainQuestion == '' || $scope.mainQuestion == undefined) {
            $scope.error('Please Input Question!');
            return;
        }
        //if feedback type is not selected, return
        if ($scope.feedbacktype == undefined) {
            $scope.error('Please Select Feedback Type!');
            return;
        }
        if ($scope.questionset == undefined) {
            $scope.error('Please Select Question Set!');
            return;
        }
        var feedqts = [];
        //Scale 10 questions
        if ($scope.feedqt1)
            feedqts.push($scope.feedqt1);
        if ($scope.feedqt2)
            feedqts.push($scope.feedqt2);
        if ($scope.feedqt3)
            feedqts.push($scope.feedqt3);
        if ($scope.feedqt4)
            feedqts.push($scope.feedqt4);
        if ($scope.feedqt5)
            feedqts.push($scope.feedqt5);
        if ($scope.feedqt6)
            feedqts.push($scope.feedqt6);
        if ($scope.feedqt7)
            feedqts.push($scope.feedqt7);
        if ($scope.feedqt8)
            feedqts.push($scope.feedqt8);
        if ($scope.feedqt9)
            feedqts.push($scope.feedqt9);
        if ($scope.feedqt10)
            feedqts.push($scope.feedqt10);
        //user mail
        var teachermail = firebase.auth().currentUser.email;
        if ($scope.temp_image == undefined) $scope.temp_image = ''
        var qtdetails = { question: $scope.mainQuestion, type: $scope.feedbacktype, feedqts: feedqts, teacher: teachermail, image: $scope.temp_image, Set: $scope.questionset };//Questions
        var rootRef = firebase.database().ref();
        var storesRef = rootRef.child('Questions');
        var newStoreRef = storesRef.push();//Add record to Question table in fireabse
        newStoreRef.set(qtdetails).then(function () {
            $scope.success('Question is created successfully!')
            $scope.safeApply();
            setTimeout(function () {
                $scope.reload()
            }, 500);
        })
    }

    //Create Digit Question
    $scope.creatDigitQuestion = function () {
        //if question doesn't exist, return
        if ($scope.digitQuestion == '' || $scope.digitQuestion == undefined) {
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
        var qtdetails = { question: $scope.digitQuestion, teacher: teachermail, image: $scope.temp_image, Set: $scope.questionset };//Questions
        var rootRef = firebase.database().ref();
        var storesRef = rootRef.child('DigitQuestions');
        var newStoreRef = storesRef.push();//Add record to Question table in fireabse
        newStoreRef.set(qtdetails).then(function () {
            $scope.success('Question is created successfully!')
            $scope.safeApply();
            setTimeout(function () {
                $scope.reload()
            }, 500);
        })
    }


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


    //-------------------------------------------------------------------
    // create Dropdown question

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

    //-------------------------------------------------------

    // Create Slide Type Question


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

    // =====================================================================================|
    //                                                                  					|
    // 								Display Question functions									|
    //                                                                  					|
    // =====================================================================================|


    $scope.getAllQuestions = function () {

        var questionsetkey = localStorage.getItem("questionsetkey");
        $scope.questionsetName = localStorage.getItem("questionsetName");

        // ++++++++++++++++++ get Feedback Type Questions ++++++++++++++++++
        $scope.feedbackTypequestions = [];
        var qtdata = firebase.database().ref('Questions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                $scope.feedbackTypequestions.push({ value: childSnapshot.val()['question'], type: 'Feedback Type' });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get digit Type Questions ++++++++++++++++++
        $scope.digitTypequestions = [];
        var qtdata = firebase.database().ref('DigitQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                $scope.digitTypequestions.push({ value: childSnapshot.val()['question'], type: 'Digit Type' });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get text Type Questions ++++++++++++++++++
        $scope.textTypequestions = [];
        var qtdata = firebase.database().ref('TextQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                $scope.digitTypequestions.push({ value: childSnapshot.val()['question'], type: 'Text Type' });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get dropdown Type Questions ++++++++++++++++++
        $scope.dropdownTypequestions = [];
        var qtdata = firebase.database().ref('DropdownQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                $scope.digitTypequestions.push({ value: childSnapshot.val()['question'], type: 'Dropdown Type' });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get slide Type Questions ++++++++++++++++++
        $scope.slideTypequestions = [];
        var qtdata = firebase.database().ref('SlideQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {

            snapshot.forEach(function (childSnapshot) {
                $scope.digitTypequestions.push({ value: childSnapshot.val()['question'], type: 'Slide Type' });
            });
            $scope.safeApply();
        });
    }




    // =====================================================================================|
    //                                                                  					|
    // 								Export All Question functions									|
    //                                                                  					|
    // =====================================================================================|

    //=======================get questions functions===============     


    $scope.getqtsteacherside = function (questionRefName) {

        // firebase.auth().onAuthStateChanged(function (user) {
        //     if (user) {
        var questionSetRef = firebase.database().ref('QuestionSets');
        questionSetRef.on('value', function (snapshot) {
            questionSets = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key
                var childData = childSnapshot.val();
                questionSets[key] = childData['setname'];
            });
            var questionsRef = firebase.database().ref(questionRefName);
            questionsRef.on('value', function (snapshot) {
                $scope.questions = [];
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key
                    var childData = childSnapshot.val();
                    var set = childData['Set'];

                    if (questionRefName == 'Questions') {  //if Feedback type question
                        if (childData['feedqts'] == undefined) {
                            $scope.questions.push({
                                key: key, value: childData['question'], type: childData['type'], questionSet: questionSets[set], feedqts: []
                            });
                        } else {
                            $scope.questions.push({
                                key: key, value: childData['question'], type: childData['type'], questionSet: questionSets[set], feedqts: childData['feedqts']
                            });
                        }
                    } else {
                        $scope.questions.push({ key: key, value: childData['question'], questionSet: questionSets[set] });
                    }
                });
                $scope.safeApply();
            });
        });
        //     } else {
        //         $scope.error("You need to login!");
        //     }
        // });
    }
    //======================================================================
    $scope.exportAllQuestionDatas = function (dbname) {
        localStorage.setItem("databasename", dbname);
        window.location.href = './exportAlltoExcel.html';
    }
    //=======================export a response functions===============    
    $scope.exportQuestionDatas = function (key, question, dbname) {
        localStorage.setItem("exportQuestionKey", key);
        localStorage.setItem("exportQuestionsentence", question);
        localStorage.setItem("databasename", dbname);
        window.location.href = './export.html';
    }
    //=======================delete a response functions===============    
    $scope.deletequestion = function (key, dbname) {
        if (confirm('Do you want to delete this question?')) {
            $scope.deletingprogresskey = true;
            var i = 0;
            dbnames.forEach(dbname => {
                firebase.database().ref(dbname + '/' + key).remove();
            });
            $scope.success('Removed Successfully!');
            $scope.safeApply();

            setTimeout(function () {
                $scope.reload();
            }, 1000);
        }
    }



    // =====================================================================================|
    //                                                                  					|
    // 								Export All Question to Excel									|
    //                                                                  					|
    // =====================================================================================|

    $scope.initExport = function () {
        $scope.hidefeedfield = true;
        var exportQuestionKey = localStorage.getItem("exportQuestionKey");
        $scope.exportQuestionsentence = localStorage.getItem("exportQuestionsentence");
        $scope.databasename = localStorage.getItem("databasename");
        $scope.lodingfinished = false;
        // firebase.auth().onAuthStateChanged(function (user) {
        //     if (user) {
        $scope.getAnswers(exportQuestionKey, $scope.exportQuestionsentence)
        $scope.lodingfinished = true;
        $scope.safeApply();
        //     } else {
        //         $scope.error("You need to login!");
        //     }
        // });
    }

    $scope.initExportAll = function () {
        $scope.hidefeedfield = true;
        $scope.databasename = localStorage.getItem("databasename");
        $scope.lodingfinished = false;
        // firebase.auth().onAuthStateChanged(function (user) {
        //     if (user) {
        $scope.getAllAnswers();
        $scope.lodingfinished = true;
        $scope.safeApply();
        //     } else {
        //         $scope.error("You need to login!");
        //     }
        // });
    }
    $scope.getAllAnswers = function () {
        $scope.answers = [];
        var questions = firebase.database().ref($scope.databasename);
        questions.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                var exportQuestionKey = childSnapshot.key;
                $scope.getAnswers(exportQuestionKey, childSnapshot.val()['question']);
            });
        })
    }
    // $scope.getAnswers = function (exportQuestionKey, exportQuestionsentence) {
    //     $scope.answers = [];
	// 	var answers = firebase.database().ref($scope.databasename + '/' + exportQuestionKey + '/answer');
	// 	answers.on('value', function (snapshot) {
	// 		$scope.feedtextlimit = 0;
	// 		var resultaverage;
	// 		snapshot.forEach(function (childSnapshot) {
	// 			var answerkey = childSnapshot.key;
    //             //Get Feedback Texts and max count                
				
	// 			if ($scope.databasename == 'Answers') {
	// 				$scope.hidefeedfield = false;
	// 				var totalfeedtexts = firebase.database().ref('FeedbackTexts/' + exportQuestionKey + '/' + answerkey);
	// 				$scope.texts = [];
	// 				$scope.thcols = [];
	// 				totalfeedtexts.on('value', function (snapshot) {
	// 					if (!snapshot.val()) {
	// 						$scope.texts.push('');
	// 					} else {
	// 						snapshot.forEach(function (feedsnap) {
	// 							$scope.texts.push(feedsnap.val());								
	// 						});
	// 					}
	// 					if ($scope.texts.length > $scope.feedtextlimit)
	// 						$scope.feedtextlimit = $scope.texts.length;					
	// 				});
	// 				//Get Average score
	// 				var totalsumscore = 0;
	// 				var countscore = 0;
	// 				var totalsocre = firebase.database().ref('Feedbacks/' + exportQuestionKey + '/' + answerkey);
	// 				totalsocre.on('value', function (snapshot1) {
	// 					snapshot1.forEach(function (childSnapshot) {
	// 						for (var t = 0; t < childSnapshot.val().length; t++) {
	// 							totalsumscore += childSnapshot.val()[t]
	// 							countscore++;
	// 						}
	// 					});
	// 				});
	// 			}else{
    //                 $(".detachingfield").detach();
    //             }

	// 			//GetUser's Profile
	// 			var userProfile = firebase.database().ref('Users/' + answerkey);
	// 			var profileinformation;
	// 			$scope.profileinformation = [];
	// 			userProfile.on('value', function (snapshot) {
	// 				profileinformation = snapshot.val();
	// 			});
	// 			//Combination
	// 			setTimeout(function () {
	// 				if (countscore == 0 || totalsumscore == 0) resultaverage = 0;
	// 				else {
	// 					resultaverage = (totalsumscore / countscore).toFixed(1);
	// 				}
	// 				setTimeout(function () {
	// 					for (var k = 0; k < $scope.feedtextlimit; k++) {
	// 						$scope.thcols[k] = '1';
	// 					}
	// 					$scope.answers.push({
	// 						'mail': childSnapshot.val()['mail'],
	// 						'question': exportQuestionsentence,
	// 						'answer': childSnapshot.val()['answer'],
	// 						'datetime': childSnapshot.val()['datetime'],
	// 						'feedtxt': texts, 'averagescore': resultaverage,
	// 						'Country': profileinformation.country,
	// 						'Gender': profileinformation.gender,
	// 						'Profession': profileinformation.profession,
	// 						'Age': profileinformation.age,
	// 						'Mothertongue': profileinformation.countrylanguage,
	// 						'Groupcode': profileinformation.groupcode
	// 					});

	// 					$scope.safeApply();
	// 				}, 2000);
	// 			}, 1000)

	// 		});
	// 	})
    // }
    $scope.getAnswers = function (exportQuestionKey, exportQuestionsentence) {
        $scope.answers = [];
		var answers = firebase.database().ref($scope.databasename + '/' + exportQuestionKey + '/answer');
		answers.on('value', function (snapshot) {
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

			});
		})
    }
});
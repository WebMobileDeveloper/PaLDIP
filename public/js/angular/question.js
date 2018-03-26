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
    $scope.loadingfinished = true;
    $scope.feedtextlimit = 0;
    $scope.totalQuestionCount = 0;
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


    $scope.getTags = function () {
        $scope.loadTags();

        var questionsetkey = localStorage.getItem("questionsetkey");
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                var tagRef = firebase.database().ref('QuestionSets/' + questionsetkey + '/' + 'tags');
                tagRef.on('value', function (snapshot) {
                    $scope.selectedTags = [];

                    if (snapshot.val()) {
                        var tags = snapshot.val().split(",");
                        tags.forEach(function (tag) {
                            $scope.selectedTags.push({ name: tag, type: 'origin' });
                        })
                    }
                    $scope.safeApply();
                });
            } else {
                $scope.error("You need to login!");
            }
        });
    }
    $scope.updateTags = function () {
        var tags = '';
        var questionsetkey = localStorage.getItem("questionsetkey");

        $scope.selectedTags.forEach(function (tag) {
            if (tags == '') {
                tags = tag.name;
            } else {
                tags += ',' + tag.name
            }
        });
        var tagRef = firebase.database().ref('QuestionSets/' + questionsetkey);
        tagRef.update({ tags: tags }).then(function () {
            $scope.success("Tags successfully updated!");
            $scope.reload();
        });



    }
    //  --------------------------------------------------------------------
    //                     end of Auto complete chips






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

        $scope.loadingfinished = false;
        $scope.createdByMe = true;
        $scope.setsInGroup = {};
        $scope.grouptitle = localStorage.getItem("groupname");
        var groupkey = localStorage.getItem("groupkey").split("/")[0];
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                var uid = user.uid;
                var setIngroupdata = firebase.database().ref('Groups/' + uid + '/' + groupkey + '/QuestionSets');
                setIngroupdata.on('value', function (groupSnapshot) {
                    groupSnapshot.forEach(function (set) {
                        $scope.setsInGroup[set.val()['key']] = set.val();
                    });
                    if ($scope.setsInGroup.length == 0) {
                        $scope.warning("There isn't any question set.");
                        $scope.loadingfinished = true;
                        $scope.safeApply();
                        return;
                    }
                    var questionsRef = firebase.database().ref(questionRefName);
                    questionsRef.on('value', function (qtSnapshot) {
                        $scope.questions = [];
                        qtSnapshot.forEach(function (childSnapshot) {
                            if ($scope.setsInGroup[childSnapshot.val()['Set']]) {
                                var key = childSnapshot.key
                                var childData = childSnapshot.val();
                                var questionSet = $scope.setsInGroup[childSnapshot.val()['Set']];

                                if (questionRefName == 'Questions') {  //if Feedback type question
                                    if (childData['feedqts'] == undefined) {
                                        $scope.questions.push({
                                            key: key, value: childData['question'], type: childData['type'], questionSet: questionSet, feedqts: []
                                        });
                                    } else {
                                        $scope.questions.push({
                                            key: key, value: childData['question'], type: childData['type'], questionSet: questionSet, feedqts: childData['feedqts']
                                        });
                                    }
                                } else {
                                    $scope.questions.push({ key: key, value: childData['question'], questionSet: questionSet });
                                }
                            }
                        });
                        if ($scope.questions.length == 0) {
                            $scope.warning("There isn't any question data.");
                        }
                        $scope.loadingfinished = true;
                        $scope.safeApply();
                    });
                });
            } else {
                $scope.error("You need to login!");
                $scope.loadingfinished = true;
                $scope.safeApply();
            }
        });
    }
    //======================================================================
    $scope.exportAllQuestionDatas = function (dbname) {
        localStorage.setItem("databasename", dbname);
        var questionkeyArrStr = "";
        $scope.questions.forEach(function (qst) {
            questionkeyArrStr += "/" + qst.key;
        });
        localStorage.setItem("questionkeyArrStr", questionkeyArrStr);
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
            $scope.loadingfinished = false;
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

        $scope.grouptitle = localStorage.getItem("groupname");
        var groupkey = localStorage.getItem("groupkey").split("/")[0];

        $scope.hidefeedfield = true;
        var exportQuestionKey = localStorage.getItem("exportQuestionKey");
        $scope.exportQuestionsentence = localStorage.getItem("exportQuestionsentence");
        $scope.databasename = localStorage.getItem("databasename");
        $scope.loadingfinished = false;
        $scope.answers = [];
        $scope.totalLoopCount = 0;
        $scope.getAnswers(exportQuestionKey, $scope.exportQuestionsentence);
    }

    $scope.initExportAll = function () {
        $scope.grouptitle = localStorage.getItem("groupname");

        $scope.hidefeedfield = true;
        $scope.databasename = localStorage.getItem("databasename");
        $scope.loadingfinished = false;
        $scope.answers = [];
        $scope.getAllAnswers();
    }
    $scope.getAllAnswers = function () {     

        var questionkeyArrStr =localStorage.getItem("questionkeyArrStr");
        var questionsRef = firebase.database().ref($scope.databasename);
        questionsRef.on('value', function (qtSnapshot) {
            $scope.totalLoopCount = 0;
            qtSnapshot.forEach(function (childSnapshot) {   
                var exportQuestionKey = childSnapshot.key;   
                if (questionkeyArrStr.includes(exportQuestionKey)) {
                    $scope.totalLoopCount++;
                } 
            });

            if ($scope.totalLoopCount == 0) {
                $scope.loadingfinished = true;
                $scope.noAnswerMessage = "There isn't any questions.";
                $scope.safeApply();
            } else {                
                qtSnapshot.forEach(function (childSnapshot) {                    
                   
                    var exportQuestionKey = childSnapshot.key;   
                    if (questionkeyArrStr.includes(exportQuestionKey)) {
                        $scope.totalLoopCount--;
                        $scope.getAnswers(exportQuestionKey, childSnapshot.val()['question']);
                    } 
                });
            }
        });

    }


    $scope.getAnswers = function (exportQuestionKey, exportQuestionsentence) {
        
        var answersRef = firebase.database().ref($scope.databasename + '/' + exportQuestionKey + '/answer');
        answersRef.on('value', function (answersSnapshot) {
            $scope.feedtextlimit = 0;
            var resultaverage;
            $scope.thcols = [];
            var totalAnswerCount = answersSnapshot.numChildren();
            if (totalAnswerCount == 0) {
                if ($scope.totalLoopCount == 0) {
                    if ($scope.answers.length == 0) {
                        $scope.noAnswerMessage = "There isn't any answers.";
                    }
                    $scope.loadingfinished = true;
                    $scope.safeApply();
                    return;
                }
            }
            $scope.totalLoopCount += totalAnswerCount;
            
            answersSnapshot.forEach(function (answerSnapshot) {
                $scope.totalLoopCount--;
                var answerkey = answerSnapshot.key;
                //Get Feedback Texts and max count                              
                if ($scope.databasename != 'Answers') {
                    $(".detachingfield").detach();
                    $scope.totalScoreCount = 0;
                    $scope.getScoreData(true, exportQuestionsentence, answerSnapshot, []);
                } else {
                    $scope.hidefeedfield = false;
                    var totalfeedtexts = firebase.database().ref('FeedbackTexts/' + exportQuestionKey + '/' + answerkey);
                    var texts = [];

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

                        //Get Average score
                        var socreRef = firebase.database().ref('Feedbacks/' + exportQuestionKey + '/' + answerkey);
                        socreRef.on('value', function (scoreSnapshot) {
                            var totalScoreCount = scoreSnapshot.numChildren();
                            if (totalScoreCount == 0) {
                                $scope.getScoreData(true, exportQuestionsentence, answerSnapshot, texts);
                            } else {
                                var i = 0;
                                scoreSnapshot.forEach(function (score) {
                                    i++;
                                    $scope.getScoreData((i == totalScoreCount), exportQuestionsentence, answerSnapshot, texts, score);
                                });
                            }
                        });
                    });
                }
            });
        })
    }
    $scope.getScoreData = function (lastScore, exportQuestionsentence, answerSnapshot, texts, score = undefined) {
        
        
        var totalsumscore = 0;
        var countscore = 0;
        var resultaverage = 0;

        if (score) {
            for (var t = 0; t < score.val().length; t++) {
                totalsumscore += score.val()[t];
                countscore++;
            }
        }

        //GetUser's Profile
        if (lastScore) {
            var userProfile = firebase.database().ref('Users/' + answerSnapshot.key);
            var profileinformation = [];
            userProfile.on('value', function (snapshot) {
                profileinformation = snapshot.val();
                if (countscore != 0 && totalsumscore != 0) {
                    resultaverage = (totalsumscore / countscore).toFixed(1);
                }
                for (var k = 0; k < $scope.feedtextlimit; k++) {
                    $scope.thcols[k] = '1';
                }
                $scope.answers.push({
                    'mail': answerSnapshot.val()['mail'],
                    'question': exportQuestionsentence,
                    'answer': answerSnapshot.val()['answer'],
                    'datetime': answerSnapshot.val()['datetime'],
                    'feedtxt': texts,
                    'averagescore': resultaverage,
                    'Country': profileinformation.country,
                    'Gender': profileinformation.gender,
                    'Profession': profileinformation.profession,
                    'Age': profileinformation.age,
                    'Mothertongue': profileinformation.countrylanguage,
                    // 'Groupcode': profileinformation.groupcode
                });            

                
                if ($scope.totalLoopCount == 0) {
                    if ($scope.answers.length == 0) {
                        $scope.noAnswerMessage = "There isn't any answers.";
                    }
                    $scope.loadingfinished = true;
                    $scope.safeApply();
                }
            });
        }
    }
});
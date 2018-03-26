var app = angular.module('DemoApp', ['ngMaterial', 'toaster']);

app.controller('MainCtrl', function ($scope, toaster, $sce) {

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

    $scope.trustHTML = function (origin) {
        return $sce.trustAsHtml(origin);
    }


    $scope.categories = ['Teacher', 'Student'];
    $scope.feeds = [{ type: 'Text', value: 0 }, { type: 'Scale', value: 1 }, { type: 'Scale and Text', value: 2 }];
    $scope.answerindex = 0;
    $scope.questionplan = '';
    $scope.hideindex = false;
    $scope.deletingprogresskey = false;

    $scope.imgloaded = false;

    $scope.sumval = "There isn't no other's answer";


    $scope.progresskey = true;
    $scope.scalescores = {};
    $scope.chartDescription = "";


    $scope.loginedUserId = localStorage.getItem("loginedUserId");

    $scope.question = localStorage.getItem('question');
    $scope.questionkey = localStorage.getItem('questionkey');


    $scope.questionsDBname = localStorage.getItem("questionsDBname");
    $scope.answersDBname = localStorage.getItem("answersDBname");

    $scope.questionsetName = localStorage.getItem("questionsetName");
    $scope.questiontype = parseInt(localStorage.getItem('qtype'));
    $scope.questiontype2 = parseInt(localStorage.getItem('qtype'));
    if ($scope.questiontype == 2) {
        $scope.questiontype2 = 0
    }

    $scope.previousanswer = localStorage.getItem("previousanswer");
    $scope.previousanswerval = localStorage.getItem("previousanswerval");
    $scope.currentmyanswer = localStorage.getItem("currentmyanswer");

    $scope.feedqts = localStorage.getItem('feedqts');


    try {        // This exists for Feedback Questions.
        $scope.feedbackquestions = $scope.feedqts.split(',')
        $scope.scalehide = 0;
    } catch (e) {
        $scope.scalehide = 1;
    }

    //check if answer text will be render
    //  true: text type answer render    
    //  false: dropdown type answer render

    switch ($scope.answersDBname) {
        case 'Answers':  //Feedbacktype
            $scope.TextType = true;
            break;
        case 'DigitAnswers':
            $scope.TextType = true;
            $scope.previousanswer = parseFloat($scope.previousanswer);
            break;
        case 'TextAnswers':
            $scope.TextType = true;
            break;
        case 'DropdownAnswers':
            $scope.TextType = false;
            break;
        case 'SlideAnswers':
            $scope.TextType = false;
            break;
    }
    // $scope.currentmydigitanswer = localStorage.getItem("currentmydigitanswer");
    //$scope.digitanswer = parseFloat(localStorage.getItem("previousdigitanswer"));

    // if ($scope.digitanswer) {
    //     // alert(localStorage.getItem("previousdigitanswer"))
    //     $scope.submitAnswerDisableKey_digit = true;
    // }
    $scope.safeApply();




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



    // =====================================================================================|
    //                                                                  					|
    // 								Get Question functions									|
    //                                                                  					|
    // =====================================================================================|
    //this function works when question for students.html and create question file loads. so when students login, questions are displayed.
    //After login, display questions.
    $scope.getAllQuestions = function () {
        var questionsetkey = localStorage.getItem("questionsetkey");

        // ++++++++++++++++++ get Feedback Type Questions ++++++++++++++++++

        var qtdata = firebase.database().ref('Questions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            $scope.feedbackTypequestions = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key
                var childData = childSnapshot.val();
                //when text feedback
                if (childData['feedqts'] == undefined)
                    $scope.feedbackTypequestions.push({ key: key, value: childData['question'], type: childData['type'], feedqts: [] });
                else//when scale feedback
                    $scope.feedbackTypequestions.push({ key: key, value: childData['question'], type: childData['type'], feedqts: childData['feedqts'] });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get digit Type Questions ++++++++++++++++++

        var qtdata = firebase.database().ref('DigitQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            $scope.digitTypequestions = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key
                var childData = childSnapshot.val();
                $scope.digitTypequestions.push({ key: key, value: childData['question'] });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get text Type Questions ++++++++++++++++++

        var qtdata = firebase.database().ref('TextQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            $scope.textTypequestions = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key
                var childData = childSnapshot.val();
                $scope.textTypequestions.push({ key: key, value: childData['question'] });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get dropdown Type Questions ++++++++++++++++++

        var qtdata = firebase.database().ref('DropdownQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            $scope.dropdownTypequestions = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key
                var childData = childSnapshot.val();
                $scope.dropdownTypequestions.push({ key: key, value: childData['question'] });
            });
            $scope.safeApply();
        });

        // ++++++++++++++++++ get slide Type Questions ++++++++++++++++++

        var qtdata = firebase.database().ref('SlideQuestions').orderByChild("Set").equalTo(questionsetkey);
        qtdata.on('value', function (snapshot) {
            $scope.slideTypequestions = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key
                var childData = childSnapshot.val();
                $scope.slideTypequestions.push({ key: key, value: childData['question'] });
            });
            $scope.safeApply();
        });
    }


    // =====================================================================================|
    //                                                                  					|
    // 								Submit Feedback Type Answer functions									|
    //                                                                  					|
    // =====================================================================================|

    $scope.goSubmitAnswer = function (key, question, answerDB, qtype = null, feedqts = null) {

        var myanswer = firebase.database().ref(answerDB + '/' + key + '/answer' + '/' + $scope.loginedUserId);
        myanswer.on('value', function (snapshot) {
            if (snapshot.val()) {
                localStorage.setItem("previousanswer", snapshot.val()['answer']);
                if (answerDB == "SlideAnswers") {
                    localStorage.setItem("previousanswerval", snapshot.val()['answerval']);
                }
            } else {
                localStorage.setItem("previousanswer", '');
            }
            localStorage.setItem("questionkey", key);
            localStorage.setItem("question", question);
            localStorage.setItem("answersDBname", answerDB);

            switch (answerDB) {
                case 'Answers':  //Feedbacktype
                    localStorage.setItem("qtype", qtype);
                    localStorage.setItem("feedqts", feedqts);
                    localStorage.setItem("questionsDBname", 'Questions');
                    window.location.href = './submitFeedbackAnswer.html';
                    break;
                case 'DigitAnswers':
                    localStorage.setItem("questionsDBname", 'DigitQuestions');
                    window.location.href = './submitDightAnswer.html';
                    break;
                case 'TextAnswers':
                    localStorage.setItem("questionsDBname", 'TextQuestions');
                    window.location.href = './submitTextAnswer.html';
                    break;
                case 'DropdownAnswers':
                    localStorage.setItem("questionsDBname", 'DropdownQuestions');
                    window.location.href = './submitDropdownAnswer.html';
                    break;
                case 'SlideAnswers':
                    localStorage.setItem("questionsDBname", 'SlideQuestions');
                    window.location.href = './submitSlideAnswer.html';
                    break;
            }
        });

    }

    //Load Image
    $scope.loadimage = function () {

        var questionkey = $scope.questionkey;  //localstorage variable,$scope.answerindex is also
        var questionRef = firebase.database().ref($scope.questionsDBname + '/' + questionkey);
        questionRef.on('value', function (snapshot) {
            var imgname = snapshot.val()['image'];
            if (imgname != "") {
                var storageRef = firebase.storage().ref();

                storageRef.child('img/' + imgname).getDownloadURL().then(function (url) {
                    document.querySelector('img').src = url;
                    $scope.imgloaded = true;
                    $scope.safeApply();
                }).catch(function (error) { })
            }
        })
    }
    //Submit Answer about selected question
    $scope.saveanswer = function () {
        console.log($scope.currAnswer)
        if ($scope.currAnswer == undefined) {
            if ($scope.TextType) {
                $scope.warning('Please Input your Answer.');
            } else {
                $scope.warning('Please select your Answer.')
            }
            return;
        }
        var updates = {};
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();

        updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/question'] = $scope.question;
        updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/answer'] = $scope.currAnswer;
        updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/mail'] = firebase.auth().currentUser.email;
        updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/datetime'] = datetime;


        if (!$scope.TextType) { // if type is dropdown answer

            studentgroupkey = localStorage.getItem("studentgroupkey");
            studentgroupname = localStorage.getItem("studentgroupname");
            updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/answerkey'] = $scope.currAnswerKey;
            updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/studentgroupkey'] = studentgroupkey;
            updates['/' + $scope.answersDBname + '/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/studentgroupname'] = studentgroupname;
        }
        firebase.database().ref().update(updates).then(function () {
            $scope.success('Your Answer is Saved Successfully!');
            localStorage.setItem("previousanswer", $scope.currAnswer);
            localStorage.setItem("currentmyanswer", $scope.currAnswer);
            switch ($scope.answersDBname) {
                case 'Answers':
                    window.location.href = './submitFeedbackAnswer_1.html';
                    break;
                case 'DigitAnswers':
                    window.location.href = './viewClassDigitAnswer.html';
                    break;
                case 'TextAnswers':
                    window.location.href = './viewClassTextAnswer.html';
                    break;
                case 'DropdownAnswers':
                    window.location.href = './viewClassDropdownAnswer.html';
                    break;
            }
        }).catch(function (error) {
            $scope.error('Submit Error!')
        });
    }

    $scope.nextpage = function () {
        localStorage.setItem("previousanswer", $scope.previousanswer);
        localStorage.setItem("currentmyanswer", $scope.previousanswer);
        switch ($scope.answersDBname) {
            case 'Answers':
                window.location.href = './submitFeedbackAnswer_1.html';
                break;
            case 'DigitAnswers':
                window.location.href = './viewClassDigitAnswer.html';
                break;
            case 'TextAnswers':
                window.location.href = './viewClassTextAnswer.html';
                break;
            case 'DropdownAnswers':
                window.location.href = './viewClassDropdownAnswer.html';
                break;
        }
    }

    //******************************Submit Feedback(getanswers,next/previous answer,get stars,getfeedtext),SubmitFeedback******************************//

    // this works when screen2.html load. screen2 is "submit feedback" page
    //Get All answers about selected question
    $scope.getanswers = function () {
        var questionkey = $scope.questionkey;//localstorage variable,$scope.answerindex is also
        $scope.answers = [];
        var answers = firebase.database().ref('Answers/' + questionkey + '/answer');
        answers.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                $scope.answers.push({ 'answerval': childSnapshot.val()['answer'], 'answerkey': childSnapshot.key });
            });
            $scope.answerplan = $scope.answers[$scope.answerindex].answerval;//To display in screen2,html
            $scope.answerkey = $scope.answers[$scope.answerindex].answerkey;
            // $scope.safeApply();
            $scope.hideindex = true;//hide progressbar in screen2.html
            /*Load Stars and Text feedbacks*/
            var feedscores = firebase.database().ref('Feedbacks/' + $scope.questionkey + '/' + $scope.answerkey + '/' + firebase.auth().currentUser.uid);
            feedscores.on('value', function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    $scope.setstar(childSnapshot.val() - 1, childSnapshot.key);// saved stars load
                    $scope.safeApply();
                });
            })
            var feedtexts = firebase.database().ref('FeedbackTexts/' + $scope.questionkey + '/' + $scope.answerkey + '/' + firebase.auth().currentUser.uid);
            feedtexts.on('value', function (snapshot) {
                $scope.feedbacktext = snapshot.val()
                $scope.safeApply();
            });

            /*Load Stars and Text feedbacks*/

        });

    }

    //When load answer or click star, set stars
    $scope.setstar = function (index, rowindex) {
        var catchedrow = $('.starfield div .starrow')[rowindex];
        var fivestars = $(catchedrow)[0].children;
        for (var i = index; i >= 0; i--) {
            $(fivestars)[i].classList.add('checked');
        }
        for (var i = index + 1; i < 5; i++) {
            $(fivestars)[i].classList.remove('checked');
        }
        $scope.scalescores[rowindex] = index + 1
    }
    //formart scales-about five stars
    $scope.formatstar = function () {
        $scope.scalescores = {};
        for (var j = -1; j < 10; j++) {
            try {
                var catchedrow = $('.starfield div .starrow')[j];
                var fivestars = $(catchedrow)[0].children;
                for (var i = 0; i < 5; i++) {
                    $(fivestars)[i].classList.remove('checked');
                }
            } catch (e) { }
        }
    }
    // submit stars and text feedback
    $scope.submitfeedback = function () {
        // if(!$scope.scalescores==null)
        if ($scope.questiontype == 1) {//type==scale
            var updates = {};
            updates['/Feedbacks/' + $scope.questionkey + '/' + $scope.answerkey + '/' + $scope.loginedUserId] = $scope.scalescores;
            $scope.success('Your feedback is submitted Successfully!');
            firebase.database().ref().update(updates).then(function () {
            }).catch(function (error) {
                $scope.error('Submit Error!')
            });

        } else if ($scope.questiontype == 0) {//scale==text
            var updates = {};
            updates['/FeedbackTexts/' + $scope.questionkey + '/' + $scope.answerkey + '/' + $scope.loginedUserId] = $scope.feedbacktext;
            firebase.database().ref().update(updates).then(function () {
                //$scope.feedbacktext = '';
                $scope.success('Your feedback is submitted Successfully!');
                $scope.safeApply();
            }).catch(function (error) {
                $scope.error('Submit Error!')
            });
        } else if ($scope.questiontype == 2) {//scale==both
            var updates = {};
            updates['/Feedbacks/' + $scope.questionkey + '/' + $scope.answerkey + '/' + $scope.loginedUserId] = $scope.scalescores;
            firebase.database().ref().update(updates).then(function () {
                var updates2 = {};
                updates2['/FeedbackTexts/' + $scope.questionkey + '/' + $scope.answerkey + '/' + $scope.loginedUserId] = $scope.feedbacktext;
                firebase.database().ref().update(updates2).then(function () {
                    $scope.success('Your feedback is submitted Successfully!');
                    //$scope.feedbacktext = '';
                    $scope.safeApply();
                }).catch(function (error) {
                    $scope.error('Submit Error!')
                    $scope.safeApply();
                });
            }).catch(function (error) {
                $scope.error('Submit Error!')
            });
        }
    }
    //When click next answer button( " > " )
    $scope.increaseindex = function () {
        $scope.answerindex++;
        try {
            $scope.answerplan = $scope.answers[$scope.answerindex].answerval;
            $scope.answerkey = $scope.answers[$scope.answerindex].answerkey;

            var feedscores = firebase.database().ref('Feedbacks/' + $scope.questionkey + '/' + $scope.answerkey + '/' + firebase.auth().currentUser.uid);
            feedscores.on('value', function (snapshot) {
                var i = 0;
                snapshot.forEach(function (childSnapshot) {
                    $scope.setstar(childSnapshot.val() - 1, childSnapshot.key);
                });
                if (snapshot.val() == null) {
                    $scope.formatstar();
                }
                $scope.safeApply();
            });
            var feedtexts = firebase.database().ref('FeedbackTexts/' + $scope.questionkey + '/' + $scope.answerkey + '/' + firebase.auth().currentUser.uid);
            feedtexts.on('value', function (snapshot) {
                $scope.feedbacktext = snapshot.val()
                $scope.safeApply();
            });

        } catch (e) {
            $scope.info('This is last Answer.')
            $scope.answerindex--;
        }
    }

    //When click previous answer button( " < " )
    $scope.decreaseindex = function () {
        $scope.answerindex--;
        if ($scope.answerindex < 0) {
            $scope.info('This is first Answer.')
            $scope.answerindex = 0;
        }
        else {
            $scope.answerplan = $scope.answers[$scope.answerindex].answerval;
            $scope.answerkey = $scope.answers[$scope.answerindex].answerkey;
            var feedscores = firebase.database().ref('Feedbacks/' + $scope.questionkey + '/' + $scope.answerkey + '/' + firebase.auth().currentUser.uid);
            feedscores.on('value', function (snapshot) {
                var i = 0;
                snapshot.forEach(function (childSnapshot) {
                    $scope.setstar(childSnapshot.val() - 1, childSnapshot.key);
                });
                $scope.safeApply();
                if (snapshot.val() == null) {
                    $scope.formatstar();
                }
            });
            var feedtexts = firebase.database().ref('FeedbackTexts/' + $scope.questionkey + '/' + $scope.answerkey + '/' + firebase.auth().currentUser.uid);
            feedtexts.on('value', function (snapshot) {
                $scope.feedbacktext = snapshot.val()
                $scope.safeApply();
            });

        }
    }


    //******************************Feedback Views******************************//
    $scope.myfeedbackscore = function () {
        $scope.viewfeedbtn = true;

        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                if ($scope.questiontype == 1) {
                    var countfeeds = $scope.feedbackquestions.length;
                    $scope.tscores = [];
                    var totalsocre = firebase.database().ref('Feedbacks/' + $scope.questionkey + '/' + user.uid);
                    var j = 0;
                    totalsocre.on('value', function (snapshot) {
                        snapshot.forEach(function (childSnapshot) {
                            j++;
                            for (var i = 0; i < countfeeds; i++) {
                                if (!parseInt(childSnapshot.val()[i])) {
                                    continue;
                                }
                                else {
                                    if (!parseInt($scope.tscores[i]))
                                        $scope.tscores[i] = 0;
                                    $scope.tscores[i] = parseInt(childSnapshot.val()[i]) + parseInt($scope.tscores[i]);
                                }
                            }
                        });
                        $scope.settotalstar($scope.tscores, j);
                    });
                } else if ($scope.questiontype == 0) {

                    var totalfeedtexts = firebase.database().ref('FeedbackTexts/' + $scope.questionkey + '/' + user.uid);
                    var texts = [];
                    totalfeedtexts.on('value', function (snapshot) {
                        var j = 0;
                        snapshot.forEach(function (childSnapshot) {
                            texts[j] = childSnapshot.val();
                            j++;
                        });
                        $scope.feedtextlimit = j - 1;
                        $scope.texts = texts;
                        $scope.feedindex = 0;
                        $scope.progresskey = false;
                        $scope.viewfeedbtn = false;
                        $scope.safeApply()
                    });

                } else if ($scope.questiontype == 2) {
                    var totalfeedtexts = firebase.database().ref('FeedbackTexts/' + $scope.questionkey + '/' + user.uid);
                    var texts = [];
                    totalfeedtexts.on('value', function (txtsnapshot) {
                        var j = 0;
                        txtsnapshot.forEach(function (txtchildSnapshot) {
                            texts[j] = txtchildSnapshot.val();
                            j++;
                        });
                        $scope.feedtextlimit = j - 1;
                        $scope.texts = texts;
                        $scope.feedindex = 0;
                        $scope.safeApply()
                    });
                    var countfeeds = $scope.feedbackquestions.length;
                    $scope.tscores = [];
                    var totalsocre = firebase.database().ref('Feedbacks/' + $scope.questionkey + '/' + user.uid);
                    var scoreindex = 0;
                    totalsocre.on('value', function (snapshot) {
                        snapshot.forEach(function (childSnapshot) {
                            scoreindex++;
                            for (var i = 0; i < countfeeds; i++) {
                                if (!parseInt(childSnapshot.val()[i])) {
                                    continue;
                                }
                                else {
                                    if (!parseInt($scope.tscores[i]))
                                        $scope.tscores[i] = 0;
                                    $scope.tscores[i] = parseInt(childSnapshot.val()[i]) + parseInt($scope.tscores[i]);
                                }
                            }
                        });
                        $scope.settotalstar($scope.tscores, scoreindex);
                    });
                }
            } else {
                $scope.error("You need to login!");
            }
        });

    }
    $scope.nextfeedtxt = function () {
        if ($scope.feedindex < $scope.feedtextlimit)
            $scope.feedindex++;
        else
            $scope.info('This is last feedback!');
    }
    $scope.previousfeedtxt = function () {
        if ($scope.feedindex > 0)
            $scope.feedindex--;
        else
            $scope.info('This is first feedback!');
    }
    //to view my score
    $scope.settotalstar = function (vals, cntperson) {
        var scores = [];
        for (var i = 0; i < vals.length; i++) {
            scores[i] = (vals[i] / cntperson).toFixed(1);
        }
        $scope.resultscore = scores;
        $scope.progresskey = false;
        $scope.viewfeedbtn = false;
        $scope.safeApply();
    }





    // =====================================================================================|
    //                                                                  					|
    // 								Submit Text Type Answer functions									|
    //                                                                  					|
    // =====================================================================================|



    //Get Class Average Answer
    $scope.getclassAllAnswer = function () {

        var i = 1;
        var textanswer = firebase.database().ref($scope.answersDBname + '/' + $scope.questionkey + '/answer');
        textanswer.on('value', function (snapshot) {
            $scope.sumval = '';
            snapshot.forEach(function (childSnapshot) {
                if ($scope.loginedUserId != childSnapshot.key) {
                    $scope.sumval += '<b style="color: blue;">Answer ' + i + ':</b>&emsp;';
                    $scope.sumval += childSnapshot.val()['answer'];
                    $scope.sumval += '<br><br>';
                    i++;
                }
            });
            if ($scope.sumval == '') $scope.sumval = "There isn't no other's answer";
            $scope.safeApply();
        })
    }




    // =====================================================================================|
    //                                                                  					|
    // 								Submit Dropdown Type Answer functions					|
    //                                                                  					|
    // =====================================================================================|

    //Get Dropdown type options
    $scope.getdropdownoptions = function () {
        $scope.options = [];
        var optiondata = firebase.database().ref($scope.questionsDBname + '/' + $scope.questionkey);
        optiondata.on('value', function (snapshot) {
            $scope.options = snapshot.val()['options'];
        });
    }

    $scope.applyAnswer = function (e) {
        $scope.currAnswerKey = e;
        $scope.currAnswer = $scope.options[e];
        $scope.safeApply();
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


        var dropdownanswerRef = firebase.database().ref('DropdownAnswers/' + $scope.questionkey + '/answer');
        dropdownanswerRef.on('value', function (snapshot) {
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
            $scope.drawDropdownAnswerChart();
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
                $scope.chartDescription = "Compared to all groups include your group!";
                $scope.paintgraph($scope.totallabels, $scope.totalvalues, "pieChart");
            } else {
                $scope.chartDescription = "Compared only in your group!";
                $scope.paintgraph($scope.mainlabels, $scope.mainvalues, "pieChart");
            }
        } else {
            $scope.chartDescription = "Compared to all groups except your group!";
            $scope.paintgraph($scope.otherlabels, $scope.othervalues, "pieChart");
        }
        $scope.safeApply();
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






    // =====================================================================================|
    //                                                                  					|
    // 								Submit Text Type Answer functions									|
    //                                                                  					|
    // =====================================================================================|




    //Get Class Average Answer
    $scope.getclassAverage = function () {
        var sumval = 0;
        var i = 0;
        var classanswer = firebase.database().ref('DigitAnswers/' + $scope.questionkey + '/answer');
        classanswer.on('value', function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                sumval += childSnapshot.val()['answer'];
                i++;
            });
            $scope.averageanswer = (sumval / i).toFixed(1);
            $scope.safeApply()
        })
    }



    // =====================================================================================|
    //                                                                  					|
    // 								Submit Slide Type Answer functions						|
    //                                                                  					|
    // =====================================================================================|


    $scope.getSlides = function () {
        if ($scope.previousanswer) {
            $scope.paintgraph($scope.previousanswer.split(','), $scope.previousanswerval.split(','), "pieChartforSlide2");
        } else {
            var propertiesRef = firebase.database().ref('SlideQuestions/' + $scope.questionkey + '/properties');
            var i = 0;
            propertiesRef.on('value', function (snapshot) {
                $scope.slidetitles = [];
                $scope.slidegraph = [];
                snapshot.forEach(function (childSnapshot) {
                    $scope.slidetitles[i] = childSnapshot.val().propertyquestion;
                    $scope.slidegraph[i] = 0;
                    i++;
                });
                // $scope.options = snapshot.val()['options'];
                $scope.properties = snapshot.val();
                $scope.safeApply();
                $scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1");
            });
        }
    }

    $scope.implementgraph = function () {
        $scope.safeApply();
        $scope.paintgraph($scope.slidetitles, $scope.slidegraph, "pieChartforSlide1")
    }

    $scope.saveslideanswer = function () {
        var updates = {};
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        updates['/SlideAnswers/' + $scope.questionkey + '/' + 'question'] = $scope.question;
        updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/answer'] = $scope.slidetitles;
        updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/answerval'] = $scope.slidegraph;
        updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/mail'] = firebase.auth().currentUser.email;
        updates['/SlideAnswers/' + $scope.questionkey + '/answer/' + $scope.loginedUserId + '/datetime'] = datetime;

        firebase.database().ref().update(updates).then(function () {
            $scope.success('Your Answer is Saved Successfully!');
            localStorage.setItem("previousanswer", $scope.slidetitles);
            localStorage.setItem("previousanswerval", $scope.slidegraph);
            window.location.href = './viewClassSlideanswer.html';
        }).catch(function (error) {
            $scope.error('Submit Error!')
        });

    }


    $scope.viewClassSlidenanswer = function () {
        var slideanswer = firebase.database().ref('SlideAnswers/' + $scope.questionkey + '/answer');
        slideanswer.on('value', function (snapshot) {
            var classSlideVal = [];
            var countOfanswers = snapshot.numChildren();

            snapshot.forEach(function (childSnapshot) {
                var answerval = childSnapshot.val()['answerval'];

                for (var k = 0; k < answerval.length; k++) {
                    if (!classSlideVal[k]) classSlideVal[k] = 0;
                    classSlideVal[k] += answerval[k] * 1;
                }
            });

            $scope.paintgraph($scope.previousanswer.split(','), $scope.previousanswerval.split(','), "mychart")
            $scope.paintgraph($scope.previousanswer.split(','), classSlideVal, "classchart")
        });
    }
});

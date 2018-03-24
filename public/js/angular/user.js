var app = angular.module('DemoApp', ['ngMaterial', 'toaster']);
app.controller('MainCtrl', function ($scope, toaster) {

	$scope.categories = ['Teacher', 'Student'];
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



	//user switch function
	$scope.userswitch = function (val) {
		if (val == 'Teacher')
			$scope.profilefield = false;
		if (val == 'Student')
			$scope.profilefield = true;
	}


	//************************************************************************************************************** */
	// ************************  Login  *****************************************************************************
	$scope.login = function () {
		if ($scope.loginmail && $scope.pwd && $scope.usertype) {
			firebase.auth().signInWithEmailAndPassword($scope.loginmail, $scope.pwd).then(function (user) {
				var userid = user.uid;
				var starCountRef = firebase.database().ref('Users/' + userid);
				starCountRef.on('value', function (snapshot) {
					var curusertype = snapshot.val().Usertype;
					if (curusertype != 'Admin' && $scope.usertype != curusertype) {
						firebase.auth().signOut();
						$scope.error('Select your type correctly!')
						$scope.safeApply();
					} else {
						localStorage.setItem("loginedUserId",userid);
						
						if (curusertype == 'Teacher') {
							if (snapshot.val().approval == 1)
								// window.location.href = './templates/exportAll.html';
								window.location.href = './templates/teacher/teachermain.html';
							else
								$scope.error('You are not approved yet!')
							$scope.safeApply()
						}
						if (curusertype == 'Student')
							window.location.href = './templates/student/group/mygroup-student.html';
						if (curusertype == 'Admin')
							window.location.href = './templates/common/approval.html';
					}
				});
			}).catch(function (error) {
				$scope.error(error.message)
				$scope.safeApply();
			});
		} else {
			$scope.warning('Input your information!')
		}
	}


	//when click register button-register.html
	//When user click register button, this function is called
	$scope.register = function () {
		if ($scope.basicpassword == undefined || $scope.authtype == undefined || $scope.username == undefined) {
			$scope.error('Input information correctly!')
			return;
		}
		if ($scope.profilefield == true && ($scope.country == undefined || $scope.age == undefined || $scope.gender == undefined || $scope.profession == undefined || $scope.countrylanguage == undefined || $scope.groupcode == undefined)) {
			$scope.error('Complete your profile!')
			return;
		}
		if ($scope.basicpassword.length < 8) {
			$scope.warning('Weak Password!')
			return;
		}

		if ($scope.authtype == 'Student') {
			if ($scope.groupcode == undefined || $scope.groupcode == '') {
				$scope.error('Input GroupCode!')
				return;
			}
			var groupCodeArr = $scope.groupcode.split("/");  //0: groupcode   1:teacher code
			var groupRef = firebase.database().ref('Groups/' + groupCodeArr[1] + "/" + groupCodeArr[0]);
			groupRef.once('value', function (snapshot) {
				if (snapshot.exists()) {		//  correct group 
					$scope.saveuser();
					$scope.safeApply();
				} else {							//  invalid group 
					$scope.error('Invalid GroupCode!')
					$scope.safeApply()
					return;
				}
			});
		} else {
			$scope.saveuser();
		}
	}

	$scope.saveuser = function () {
		if ($scope.basicpassword == $scope.confpassword) {
			firebase.auth().createUserWithEmailAndPassword($scope.username, $scope.basicpassword).then(function (user) {
				var uid = user.uid;
				if ($scope.profilefield == false) {
					var data = {
						Userkey: uid,
						ID: $scope.username,
						Usertype: $scope.authtype,
						password: $scope.basicpassword,
						approval: 0
					}
				} else {
					var data = {
						Userkey: uid,
						ID: $scope.username,
						Usertype: $scope.authtype,
						password: $scope.basicpassword,
						country: $scope.country,
						age: $scope.age,
						gender: $scope.gender,
						profession: $scope.profession,
						countrylanguage: $scope.countrylanguage,
					}
				}
				var updates = {};
				updates['/Users/' + uid] = data;

				firebase.database().ref().update(updates).then(function () {
					if ($scope.profilefield == true) {
						var groupcode = $scope.groupcode.split("/")[0];//Questions
						var rootRef = firebase.database().ref();
						var storesRef = rootRef.child('StudentGroups/' + uid);
						var newStoreRef = storesRef.push();//Add record to Question table in fireabse
						newStoreRef.set(groupcode).then(function () {
							$scope.success('Account Created Successfuly!')
							$scope.safeApply();
							setTimeout(function () {
								window.location.href = '../../index.html';
							}, 100);
						})
					} else {
						$scope.success('Account Created Successfuly!')
						$scope.safeApply();
						setTimeout(function () {
							window.location.href = '../../index.html';
						}, 100);
					}

				})


			}).catch(function (error) {
				$scope.error(error.message)
				$scope.safeApply();
			});
		} else {
			$scope.error('Confirm your password correctly!')
			$scope.basicpassword = '';
			$scope.confpassword = '';
		}
	}


	$scope.resetpwd = function () {
		if ($scope.requestmail == undefined || $scope.requestmail == '')
			$scope.warning('Please Input your mail!')
		else {
			var email = $scope.requestmail;
			firebase.auth().sendPasswordResetEmail(email).then(function () {
				$scope.requestmail = '';
				$scope.info('Password Reset Email Sent!');
				$scope.safeApply()
			}).catch(function (error) {
				var errorMessage = error.message;
				$scope.error(errorMessage)
				$scope.safeApply()
			})
		}
	}

	//-----------------------------------End login---------------------------------------------------------------------------------

	//Get Registered Teachers
	$scope.getRegisteredTeachers = function () {
		var usertypekey = '';
		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				var uid = user.uid;
				var loggedinuser = firebase.database().ref('Users/' + uid);
				loggedinuser.once('value', function (snapshot) {
					usertypekey = snapshot.val()['Usertype'];
					if (usertypekey != 'Admin') {
						firebase.auth().signOut();
						window.location.href = '../../index.html';
					}
					var questiondata = firebase.database().ref('Users');
					$scope.registeredTeachersMail = [];
					$scope.hidekey = [];
					$scope.teacherInformations = [];
					
					questiondata.on('value', function (snapshot) {
						var i = 0;
						snapshot.forEach(function (childsnapshot) {
							if (childsnapshot.val()['Usertype'] == 'Teacher') {
								$scope.teacherInformations[i] = childsnapshot.val();
								$scope.registeredTeachersMail[i] = childsnapshot.val()['ID'];
								$scope.hidekey[i] = childsnapshot.val()['approval'];
								i++;
							}
							$scope.safeApply()
						})
					})
				});
			} else {
				$scope.error("You need to login!");
			}
		});
	}

	$scope.enableTeacher = function (obj) {
		var userkey = obj['Userkey']
		var updates = {};
		updates['/Users/' + userkey + '/approval'] = 1;
		firebase.database().ref().update(updates).then(function () {
			$scope.success('User Enabled')
			$scope.safeApply();
		})
	}
	
	$scope.disableTeacher = function (obj) {
		var userkey = obj['Userkey']
		var updates = {};
		updates['/Users/' + userkey + '/approval'] = 0;
		firebase.database().ref().update(updates).then(function () {
			$scope.warning('User Disabled')
			$scope.safeApply();

		})

	}

	//=================================== end of copy from angular-type-script.js ===============================================

	///////////////////////////////////////////////////////- Country Languages-///////////////////////////////////////////////////////////////////////////////////////////////
	$scope.countries = [
		{ name: 'Afghanistan', code: 'AF' },
		{ name: 'Åland Islands', code: 'AX' },
		{ name: 'Albania', code: 'AL' },
		{ name: 'Algeria', code: 'DZ' },
		{ name: 'American Samoa', code: 'AS' },
		{ name: 'Andorra', code: 'AD' },
		{ name: 'Angola', code: 'AO' },
		{ name: 'Anguilla', code: 'AI' },
		{ name: 'Antarctica', code: 'AQ' },
		{ name: 'Antigua and Barbuda', code: 'AG' },
		{ name: 'Argentina', code: 'AR' },
		{ name: 'Armenia', code: 'AM' },
		{ name: 'Aruba', code: 'AW' },
		{ name: 'Australia', code: 'AU' },
		{ name: 'Austria', code: 'AT' },
		{ name: 'Azerbaijan', code: 'AZ' },
		{ name: 'Bahamas', code: 'BS' },
		{ name: 'Bahrain', code: 'BH' },
		{ name: 'Bangladesh', code: 'BD' },
		{ name: 'Barbados', code: 'BB' },
		{ name: 'Belarus', code: 'BY' },
		{ name: 'Belgium', code: 'BE' },
		{ name: 'Belize', code: 'BZ' },
		{ name: 'Benin', code: 'BJ' },
		{ name: 'Bermuda', code: 'BM' },
		{ name: 'Bhutan', code: 'BT' },
		{ name: 'Bolivia', code: 'BO' },
		{ name: 'Bosnia and Herzegovina', code: 'BA' },
		{ name: 'Botswana', code: 'BW' },
		{ name: 'Bouvet Island', code: 'BV' },
		{ name: 'Brazil', code: 'BR' },
		{ name: 'British Indian Ocean Territory', code: 'IO' },
		{ name: 'Brunei Darussalam', code: 'BN' },
		{ name: 'Bulgaria', code: 'BG' },
		{ name: 'Burkina Faso', code: 'BF' },
		{ name: 'Burundi', code: 'BI' },
		{ name: 'Cambodia', code: 'KH' },
		{ name: 'Cameroon', code: 'CM' },
		{ name: 'Canada', code: 'CA' },
		{ name: 'Cape Verde', code: 'CV' },
		{ name: 'Cayman Islands', code: 'KY' },
		{ name: 'Central African Republic', code: 'CF' },
		{ name: 'Chad', code: 'TD' },
		{ name: 'Chile', code: 'CL' },
		{ name: 'China', code: 'CN' },
		{ name: 'Christmas Island', code: 'CX' },
		{ name: 'Cocos (Keeling) Islands', code: 'CC' },
		{ name: 'Colombia', code: 'CO' },
		{ name: 'Comoros', code: 'KM' },
		{ name: 'Congo', code: 'CG' },
		{ name: 'Congo, The Democratic Republic of the', code: 'CD' },
		{ name: 'Cook Islands', code: 'CK' },
		{ name: 'Costa Rica', code: 'CR' },
		{ name: 'Cote D\'Ivoire', code: 'CI' },
		{ name: 'Croatia', code: 'HR' },
		{ name: 'Cuba', code: 'CU' },
		{ name: 'Cyprus', code: 'CY' },
		{ name: 'Czech Republic', code: 'CZ' },
		{ name: 'Denmark', code: 'DK' },
		{ name: 'Djibouti', code: 'DJ' },
		{ name: 'Dominica', code: 'DM' },
		{ name: 'Dominican Republic', code: 'DO' },
		{ name: 'Ecuador', code: 'EC' },
		{ name: 'Egypt', code: 'EG' },
		{ name: 'El Salvador', code: 'SV' },
		{ name: 'Equatorial Guinea', code: 'GQ' },
		{ name: 'Eritrea', code: 'ER' },
		{ name: 'Estonia', code: 'EE' },
		{ name: 'Ethiopia', code: 'ET' },
		{ name: 'Falkland Islands (Malvinas)', code: 'FK' },
		{ name: 'Faroe Islands', code: 'FO' },
		{ name: 'Fiji', code: 'FJ' },
		{ name: 'Finland', code: 'FI' },
		{ name: 'France', code: 'FR' },
		{ name: 'French Guiana', code: 'GF' },
		{ name: 'French Polynesia', code: 'PF' },
		{ name: 'French Southern Territories', code: 'TF' },
		{ name: 'Gabon', code: 'GA' },
		{ name: 'Gambia', code: 'GM' },
		{ name: 'Georgia', code: 'GE' },
		{ name: 'Germany', code: 'DE' },
		{ name: 'Ghana', code: 'GH' },
		{ name: 'Gibraltar', code: 'GI' },
		{ name: 'Greece', code: 'GR' },
		{ name: 'Greenland', code: 'GL' },
		{ name: 'Grenada', code: 'GD' },
		{ name: 'Guadeloupe', code: 'GP' },
		{ name: 'Guam', code: 'GU' },
		{ name: 'Guatemala', code: 'GT' },
		{ name: 'Guernsey', code: 'GG' },
		{ name: 'Guinea', code: 'GN' },
		{ name: 'Guinea-Bissau', code: 'GW' },
		{ name: 'Guyana', code: 'GY' },
		{ name: 'Haiti', code: 'HT' },
		{ name: 'Heard Island and Mcdonald Islands', code: 'HM' },
		{ name: 'Holy See (Vatican City State)', code: 'VA' },
		{ name: 'Honduras', code: 'HN' },
		{ name: 'Hong Kong', code: 'HK' },
		{ name: 'Hungary', code: 'HU' },
		{ name: 'Iceland', code: 'IS' },
		{ name: 'India', code: 'IN' },
		{ name: 'Indonesia', code: 'ID' },
		{ name: 'Iran, Islamic Republic Of', code: 'IR' },
		{ name: 'Iraq', code: 'IQ' },
		{ name: 'Ireland', code: 'IE' },
		{ name: 'Isle of Man', code: 'IM' },
		{ name: 'Israel', code: 'IL' },
		{ name: 'Italy', code: 'IT' },
		{ name: 'Jamaica', code: 'JM' },
		{ name: 'Japan', code: 'JP' },
		{ name: 'Jersey', code: 'JE' },
		{ name: 'Jordan', code: 'JO' },
		{ name: 'Kazakhstan', code: 'KZ' },
		{ name: 'Kenya', code: 'KE' },
		{ name: 'Kiribati', code: 'KI' },
		{ name: 'Korea, Democratic People\'s Republic of', code: 'KP' },
		{ name: 'Korea, Republic of', code: 'KR' },
		{ name: 'Kuwait', code: 'KW' },
		{ name: 'Kyrgyzstan', code: 'KG' },
		{ name: 'Lao People\'s Democratic Republic', code: 'LA' },
		{ name: 'Latvia', code: 'LV' },
		{ name: 'Lebanon', code: 'LB' },
		{ name: 'Lesotho', code: 'LS' },
		{ name: 'Liberia', code: 'LR' },
		{ name: 'Libyan Arab Jamahiriya', code: 'LY' },
		{ name: 'Liechtenstein', code: 'LI' },
		{ name: 'Lithuania', code: 'LT' },
		{ name: 'Luxembourg', code: 'LU' },
		{ name: 'Macao', code: 'MO' },
		{ name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK' },
		{ name: 'Madagascar', code: 'MG' },
		{ name: 'Malawi', code: 'MW' },
		{ name: 'Malaysia', code: 'MY' },
		{ name: 'Maldives', code: 'MV' },
		{ name: 'Mali', code: 'ML' },
		{ name: 'Malta', code: 'MT' },
		{ name: 'Marshall Islands', code: 'MH' },
		{ name: 'Martinique', code: 'MQ' },
		{ name: 'Mauritania', code: 'MR' },
		{ name: 'Mauritius', code: 'MU' },
		{ name: 'Mayotte', code: 'YT' },
		{ name: 'Mexico', code: 'MX' },
		{ name: 'Micronesia, Federated States of', code: 'FM' },
		{ name: 'Moldova, Republic of', code: 'MD' },
		{ name: 'Monaco', code: 'MC' },
		{ name: 'Mongolia', code: 'MN' },
		{ name: 'Montserrat', code: 'MS' },
		{ name: 'Morocco', code: 'MA' },
		{ name: 'Mozambique', code: 'MZ' },
		{ name: 'Myanmar', code: 'MM' },
		{ name: 'Namibia', code: 'NA' },
		{ name: 'Nauru', code: 'NR' },
		{ name: 'Nepal', code: 'NP' },
		{ name: 'Netherlands', code: 'NL' },
		{ name: 'Netherlands Antilles', code: 'AN' },
		{ name: 'New Caledonia', code: 'NC' },
		{ name: 'New Zealand', code: 'NZ' },
		{ name: 'Nicaragua', code: 'NI' },
		{ name: 'Niger', code: 'NE' },
		{ name: 'Nigeria', code: 'NG' },
		{ name: 'Niue', code: 'NU' },
		{ name: 'Norfolk Island', code: 'NF' },
		{ name: 'Northern Mariana Islands', code: 'MP' },
		{ name: 'Norway', code: 'NO' },
		{ name: 'Oman', code: 'OM' },
		{ name: 'Pakistan', code: 'PK' },
		{ name: 'Palau', code: 'PW' },
		{ name: 'Palestinian Territory, Occupied', code: 'PS' },
		{ name: 'Panama', code: 'PA' },
		{ name: 'Papua New Guinea', code: 'PG' },
		{ name: 'Paraguay', code: 'PY' },
		{ name: 'Peru', code: 'PE' },
		{ name: 'Philippines', code: 'PH' },
		{ name: 'Pitcairn', code: 'PN' },
		{ name: 'Poland', code: 'PL' },
		{ name: 'Portugal', code: 'PT' },
		{ name: 'Puerto Rico', code: 'PR' },
		{ name: 'Qatar', code: 'QA' },
		{ name: 'Reunion', code: 'RE' },
		{ name: 'Romania', code: 'RO' },
		{ name: 'Russian Federation', code: 'RU' },
		{ name: 'Rwanda', code: 'RW' },
		{ name: 'Saint Helena', code: 'SH' },
		{ name: 'Saint Kitts and Nevis', code: 'KN' },
		{ name: 'Saint Lucia', code: 'LC' },
		{ name: 'Saint Pierre and Miquelon', code: 'PM' },
		{ name: 'Saint Vincent and the Grenadines', code: 'VC' },
		{ name: 'Samoa', code: 'WS' },
		{ name: 'San Marino', code: 'SM' },
		{ name: 'Sao Tome and Principe', code: 'ST' },
		{ name: 'Saudi Arabia', code: 'SA' },
		{ name: 'Senegal', code: 'SN' },
		{ name: 'Serbia and Montenegro', code: 'CS' },
		{ name: 'Seychelles', code: 'SC' },
		{ name: 'Sierra Leone', code: 'SL' },
		{ name: 'Singapore', code: 'SG' },
		{ name: 'Slovakia', code: 'SK' },
		{ name: 'Slovenia', code: 'SI' },
		{ name: 'Solomon Islands', code: 'SB' },
		{ name: 'Somalia', code: 'SO' },
		{ name: 'South Africa', code: 'ZA' },
		{ name: 'South Georgia and the South Sandwich Islands', code: 'GS' },
		{ name: 'Spain', code: 'ES' },
		{ name: 'Sri Lanka', code: 'LK' },
		{ name: 'Sudan', code: 'SD' },
		{ name: 'Suriname', code: 'SR' },
		{ name: 'Svalbard and Jan Mayen', code: 'SJ' },
		{ name: 'Swaziland', code: 'SZ' },
		{ name: 'Sweden', code: 'SE' },
		{ name: 'Switzerland', code: 'CH' },
		{ name: 'Syrian Arab Republic', code: 'SY' },
		{ name: 'Taiwan, Province of China', code: 'TW' },
		{ name: 'Tajikistan', code: 'TJ' },
		{ name: 'Tanzania, United Republic of', code: 'TZ' },
		{ name: 'Thailand', code: 'TH' },
		{ name: 'Timor-Leste', code: 'TL' },
		{ name: 'Togo', code: 'TG' },
		{ name: 'Tokelau', code: 'TK' },
		{ name: 'Tonga', code: 'TO' },
		{ name: 'Trinidad and Tobago', code: 'TT' },
		{ name: 'Tunisia', code: 'TN' },
		{ name: 'Turkey', code: 'TR' },
		{ name: 'Turkmenistan', code: 'TM' },
		{ name: 'Turks and Caicos Islands', code: 'TC' },
		{ name: 'Tuvalu', code: 'TV' },
		{ name: 'Uganda', code: 'UG' },
		{ name: 'Ukraine', code: 'UA' },
		{ name: 'United Arab Emirates', code: 'AE' },
		{ name: 'United Kingdom', code: 'GB' },
		{ name: 'United States', code: 'US' },
		{ name: 'United States Minor Outlying Islands', code: 'UM' },
		{ name: 'Uruguay', code: 'UY' },
		{ name: 'Uzbekistan', code: 'UZ' },
		{ name: 'Vanuatu', code: 'VU' },
		{ name: 'Venezuela', code: 'VE' },
		{ name: 'Vietnam', code: 'VN' },
		{ name: 'Virgin Islands, British', code: 'VG' },
		{ name: 'Virgin Islands, U.S.', code: 'VI' },
		{ name: 'Wallis and Futuna', code: 'WF' },
		{ name: 'Western Sahara', code: 'EH' },
		{ name: 'Yemen', code: 'YE' },
		{ name: 'Zambia', code: 'ZM' },
		{ name: 'Zimbabwe', code: 'ZW' }
	];
});
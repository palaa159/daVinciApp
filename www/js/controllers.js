angular.module('app.controllers', [])

/* 00-settings */
.controller('SettingsCtrl', function(
    $scope,
    $rootScope,
    $state,
    Dropbox,
    Dialogs) {
    console.log('```` Rendering Settings');

    $rootScope.isWelcomePage = false;

    $scope.confirmEvent = function() {
        localStorage['event_folder'] = $rootScope.settings.event_folder;
        EVENT_FOLDER = localStorage['event_folder'];
        console.log(EVENT_FOLDER);
    };

    $scope.confirmDropboxToken = function() {
        localStorage['dropbox_token'] = $rootScope.settings.dropbox_token;
        DROPBOX_TOKEN = localStorage['dropbox_token'];
    };

    $scope.confirmMandrillEmail = function() {
        localStorage['mandrill_email'] = $rootScope.settings.mandrill_email;
        POSTMARK_EMAIL = localStorage['mandrill_email'];
    };

    $scope.confirmMandrillToken = function() {
        localStorage['mandrill_token'] = $rootScope.settings.mandrill_token;
        POSTMARK_TOKEN = localStorage['mandrill_token'];
    };

    $scope.confirmFacebookAppId = function() {
        localStorage['facebook_app_id'] = $rootScope.settings.facebook_app_id;
        FACEBOOK_APP_ID = localStorage['facebook_app_id'];
    };

    $scope.back = function() {
        Dropbox.getSettings(function(res) {
            console.log(res);

            EVENT_NAME = res.event_name;
            EVENT_BG = '/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/src_img/welcome_bg.jpg';

            $rootScope.msgToShare = res.share_comment;

            Dropbox.returnDirectLink(EVENT_BG, function(d) {
                $rootScope.backgroundBg = d;
                console.log($rootScope.backgroundBg); // √
                $state.go('/01-welcome');
                // $state.go('/03-gallery');
                if (window.cordova) {
                    $timeout(function() {
                        $cordovaSplashscreen.hide();
                    }, 1000);

                }

            });
        }, function(err) {
            console.log(err);
            if (err == null) {
                err = {};
                err.error = 'No internet connection.';
            }
            /*
          Cannot get settings file
          – EVENT_FOLDER does not exist
          – or, Internet connection lost
      */
            Dialogs.alert('settings.json | ' + err.error, 'OK', function() {
                $state.go('/00-settings');
            });
        });
    };

})

/* 01-welcome */
.controller('WelcomeCtrl', function(
    $scope,
    $rootScope) {
    console.log('```` Rendering Welcome');
    $rootScope.backgroundPosX = 0;
    $rootScope.isWelcomePage = true;
})

/* 02-register */
.controller('RegisterCtrl', function(
    $scope,
    $rootScope,
    $state,
    $ionicViewSwitcher,
    Dropbox,
    $ionicLoading,
    Mandrill) {
    console.log('```` Rendering Register');
    $rootScope.backgroundPosX = -40;
    $scope.user = {};

    $rootScope.isWelcomePage = false;

    $scope.cancel = function() {
        $ionicViewSwitcher.nextDirection('back');
        $state.go('/01-welcome');
    };

    $scope.checkInput = function() {
        // console.log('Check input fired');
        var reName = /^[a-z ,.'-]+$/i;
        var reEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var isNameOk = reName.test($scope.user.name);
        var isEmailOk = reEmail.test($scope.user.email);

        if (isNameOk && isEmailOk) {
            $scope.isFormValid = true;
        } else {
            $scope.isFormValid = false;
        }
    };

    $scope.register = function() {
        // form validation
        if ($scope.isFormValid) {
            // Spinner
            $ionicLoading.show({
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });
            Mandrill.sendMail($scope.user.name, $scope.user.email, function() {
                // Save a user
                // find a file: users_iPadID.json
                Dropbox.appendUser($scope.user.name, $scope.user.email, function() {
                    console.log('User saved.');
                    $rootScope.userToSend = $scope.user.name;
                    $rootScope.emailToSend = $scope.user.email;
                });
                // Load images
                Dropbox.getImages(function() {
                    $rootScope.gallery = $rootScope.gallery.chunk(6);
                    console.log($rootScope.gallery);
                    $ionicViewSwitcher.nextDirection('forward');
                    $state.go('/03-gallery');
                });
            });
        }

    };
})

/* 03-image-selection */
.controller('GalleryCtrl', function(
    $scope,
    $rootScope,
    $cordovaOauth,
    $cordovaPrinter,
    Mandrill,
    ngDialog,
    Dialogs,
    Dropbox) {
    // imageLoaded
    console.log('```` Rendering Gallery');
    $rootScope.backgroundPosX = -80;

    $scope.openImageModal = function(imgurl) {
        console.log('open image modal');
        IMG_TO_SHARE = imgurl;
        $scope.imgToShare = IMG_TO_SHARE;

        ngDialog.open({
            template: 'views/imageModal.html',
            scope: $scope,
            controller: function($scope, $rootScope) {
                // controller logic
                console.log('you just selected %s', IMG_TO_SHARE);
                $scope.shareViaFacebook = function() {
                    if (window.cordova) {
                        window.cookies.clear(function() {
                            console.log('Cookies cleared!');
                        });
                    }
                    $cordovaOauth.facebook(FACEBOOK_APP_ID, ['email', 'publish_actions'])
                        .then(function(result) {
                            console.log('fb login results: ' + JSON.stringify(result));
                            $rootScope.socialToShare = 'Facebook';
                            $rootScope.fb_token = result.access_token;
                            $scope.closeThisDialog();
                            $rootScope.goToPage('/04-share');
                        }, function(error) {
                            console.log('error: ' + error);
                            $rootScope.isErrorSignIn = true;
                            Dialogs.alert('Unable to complete the sign-in process. Please try again.', 'Got it');
                        });
                };
                $scope.shareViaEmail = function() {
                    console.log('Share via Email');
                    Dialogs.confirm('You want to share this photo to your registered email?', ['Cancel', 'Send Email'], function() {
                        // cancel
                        console.log('COMFIRM EMAIL SEND');
                        $scope.closeThisDialog();
                    }, function() {
                        // send email
                        // goto thank you
                        console.log('COMPILING TPL');
                        // console.log(EMAIL_TPL_PHOTO);
                        var compiled = _.template(EMAIL_TPL_PHOTO);
                        EMAIL_PHOTO_COMPILED = compiled({
                            'source_image': IMG_TO_SHARE
                        });

                        // console.log(EMAIL_TPL_PHOTO);

                        Mandrill.sharePhoto($rootScope.userToSend, $rootScope.emailToSend, function() {
                            $rootScope.socialToShare = 'Email';
                            $scope.closeThisDialog();
                            $rootScope.goToPage('/05-thankyou');
                        });
                    });

                };
                $scope.shareViaPrint = function() {
                    console.log('HIT PRINTER');
                    var page = '<img src="' + IMG_TO_SHARE + '">';
                    cordova.plugins.printer.print(page, 'Document.html', function() {
                        $rootScope.socialToShare = 'Print';
                        $scope.closeThisDialog();
                        $rootScope.goToPage('/05-thankyou');
                    });
                };
            }
        });
    };

})

/* 04-share */
.controller('ShareCtrl', function(
    $scope,
    $rootScope,
    $ionicViewSwitcher,
    $http,
    Dialogs,
    $ionicLoading,
    $state) {
    console.log('```` Rendering Share');
    $rootScope.backgroundPosX = -120;
    $scope.imgToShare = IMG_TO_SHARE;
    $scope.back = function() {
        $ionicViewSwitcher.nextDirection('back');
        $state.go('/03-gallery');
    };

    $scope.postOnFb = function(msgtoshare) {
        $ionicLoading.show({
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });
        $http.get('https://graph.facebook.com/v2.2/me?access_token=' + $rootScope.fb_token.toString())
            .success(function(data, status, headers, config) {
                console.log("get headers: " + JSON.stringify(headers));
                console.log("get user data: " + JSON.stringify(data));

                var user_id = data.id;
                // var msgToPost = $rootScope.msgToShare;
                // var photoToPost = "http://itchmo.com/wp-content/uploads/2007/06/p48118p.jpg";
                // console.log(msgtoshare);

                var msgWebSafe = escape(msgtoshare)
                    .replace(/\@/g, '%40')
                    .replace(/\*/g, '%2A')
                    .replace(/\//g, '%2F')
                    .replace(/\+/g, '%2B');

                var postURL = 'https://graph.facebook.com/v2.2/' + user_id + '/photos?access_token=' + $rootScope.fb_token + '&url=' + IMG_TO_SHARE + '&message=' + msgWebSafe;
                console.log(postURL);
                $http({
                    method: "POST",
                    url: postURL
                }).
                success(function(data) {
                    // alert("POST SUCCESSFUL"); 
                    console.log("success on POST: " + JSON.stringify(data));
                    $rootScope.goToPage('/05-thankyou');
                }).
                error(function(data) {
                    console.log("error on POST: " + JSON.stringify(data));
                    Dialogs.alert('Unable to post a photo on your Facebook. Please try again or choose another sharing option.', 'Got it');
                });

            }).
        error(function(data, status, headers, config) {
            console.log("error data: " + JSON.stringify(data));
            console.log("error status: " + status);
        });
    };
})

/* 05-thankyou */
.controller('ThankYouCtrl', function(
    $scope,
    $rootScope,
    $timeout,
    $state) {
    console.log('```` Rendering ThankYou');
    $rootScope.backgroundPosX = -160;

    $timeout(function() {
        PREV_NOW = new Date().getTime();
        $rootScope.startOver();
    }, 10000);

});
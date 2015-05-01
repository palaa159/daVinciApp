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

  $scope.confirmTwitterApiKey = function() {
    localStorage['twitter_api_key'] = $rootScope.settings.twitter_api_key;
    TWITTER_API_KEY = localStorage['twitter_api_key'];
  };

  $scope.confirmTwitterSecretKey = function() {
    localStorage['twitter_secret_key'] = $rootScope.settings.twitter_secret_key;
    TWITTER_SECRET_KEY = localStorage['twitter_secret_key'];
  };

  $scope.back = function() {
    Dropbox.getSettings(function(res) {
      console.log(res);

      EVENT_NAME = res.event_name;
      WELCOME_BG = '/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/src_img/welcome_bg.jpg';

      $rootScope.msgToShare = res.share_comment;

      // Dropbox.returnDirectLink(WELCOME_BG, function(d) {
      $rootScope.backgroundBg = $rootScope.welcomeBg;;
      console.log($rootScope.backgroundBg); // √
      $state.go('/01-welcome');
      if (window.cordova) {
        $timeout(function() {
          $cordovaSplashscreen.hide();
        }, 1000);
      }
      // });
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
  $rootScope.shouldHide = true;
})

/* 02-register */
.controller('RegisterCtrl', function(
  $scope,
  $rootScope,
  $state,
  $ionicViewSwitcher,
  Dropbox,
  Dialogs,
  $ionicLoading,
  Mandrill) {
  console.log('```` Rendering Register');
  $scope.user = {};

  $rootScope.isWelcomePage = false;

  $scope.cancel = function() {
    $ionicViewSwitcher.nextDirection('back');
    $rootScope.shouldHide = true;
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
          $ionicViewSwitcher.nextDirection('forward');
          $state.go('/03-gallery');
        });
      });
    } else {
      Dialogs.alert('One or more of your inputs is invalid. Please try again.', 'Got it', function() {});
    }
  };
})

/* 03-image-selection */
.controller('GalleryCtrl', function(
  $scope,
  $rootScope,
  $cordovaOauth,
  $cordovaFile,
  $cordovaPrinter,
  $cordovaSocialSharing,
  $cordovaFileTransfer,
  $timeout,
  Mandrill,
  ngDialog,
  Dialogs,
  $ionicLoading,
  $ionicSlideBoxDelegate,
  Dropbox) {
  // imageLoaded
  console.log('```` Rendering Gallery');
  // $rootScope.backgroundPosX = -80;

  $scope.refreshGallery = function() {
    console.log('refreshing gallery');

    $ionicLoading.show({
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });
    $ionicSlideBoxDelegate.slide(0, 500);
    $timeout(function() {
      Dropbox.getImages(function() {
        $rootScope.gallery = $rootScope.gallery.chunk(6);
        $ionicSlideBoxDelegate.update();
        // Update Slide
        $timeout(function() {
          $ionicLoading.hide();
        }, 1000);


      });
    }, 1000);

  };

  $scope.openImageModal = function(imgurl) {
    console.log('open image modal');
    IMG_TO_SHARE = imgurl;
    $scope.imgToShare = IMG_TO_SHARE;



    ngDialog.open({
      template: 'views/imageModal.html',
      scope: $scope,
      controller: function($scope, $rootScope) {
        console.log('you just selected %s', IMG_TO_SHARE);

        /*** TWITTER LOGIN ***/
        $scope.shareViaTwitter = function() {

          if (window.cordova) {
            window.cookies.clear(function() {
              console.log('Cookies cleared!');
            });
          }
          $cordovaOauth.twitter(TWITTER_API_KEY, TWITTER_SECRET_KEY)
            .then(function(result) {
              console.log('twitter login results: ' + JSON.stringify(result, null, '\t'));
              /*example result object: 
              { "oauth_token": "2795506425-A7gBaNkh1cKbNUKkivnjtldMVvbJ7AXlL4BdC4I",
              "oauth_token_secret": "DLIy2ux3n2U4Aq6wcoSIiyNlm7KcEiEzFpNcbGMQwOyJh",
              "user_id": "2795506425", "screen_name": "momentus_io" } */
              $rootScope.socialToShare = 'Twitter';
              $rootScope.twitter_token = result.oauth_token;
              $rootScope.twitter_secret_token = result.oauth_token_secret;
              $scope.closeThisDialog();
              $rootScope.goToPage('/04-share');
            }, function(error) {
              console.log('twitter login error: ' + JSON.stringify(error));
              $rootScope.isErrorSignIn = true;
              Dialogs.alert('Unable to complete the sign-in process. Please try again.', 'Got it');
            });
        };

        /*** FACEBOOK LOGIN ***/
        $scope.shareViaFacebook = function() {
          if (window.cordova) {
            window.cookies.clear(function() {
              console.log('Cookies cleared!');
            });
          }
          $cordovaOauth.facebook(FACEBOOK_APP_ID, ['email', 'publish_actions'])
            .then(function(result) {
              console.log('fb login results: ' + JSON.stringify(result, null, '\t'));
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

        /*** MANDRILL ***/
        $scope.shareViaEmail = function() {
          console.log('Share via Email');
          Dialogs.confirm('Do you want to share this photo to your registered email?', ['Cancel', 'Send Email'], function() {
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
              // $scope.closeThisDialog();
              // $rootScope.goToPage('/05-thankyou');
              Dialogs.confirm('Your photo has been sent. Would you like to share another?', ['No, I\'m Finished', 'Share Again'], function() {
                // No
                $scope.closeThisDialog();
                $rootScope.goToPage('/05-thankyou');
              }, function() {
                // Yes
                $scope.closeThisDialog();
              });
            });
          });
        };

        /*** AIR PRINT ***/
        $scope.shareViaPrint = function() {
          console.log('HIT PRINTER');
          var page =
            '<body style="margin: 0; padding: 0;"><div style="margin: 0; padding: 0px; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; background: url(' + $rootScope.overlayImg + ') no-repeat; background-size: cover; background-position: 50%;"><center><div style="position: relative; margin-top: 170px;"><img width="80%" src="' + IMG_TO_SHARE + '"></div></center></div></body>';
          cordova.plugins.printer.print(page, 'Document.html', function() {
            $rootScope.socialToShare = 'Print';
            // $scope.closeThisDialog();
            // $rootScope.goToPage('/05-thankyou');
            Dialogs.confirm('Your photo has been sent to the printer. Would you like to share another?', ['No, I\'m Finished', 'Share Again'], function() {
              // No
              $scope.closeThisDialog();
              $rootScope.goToPage('/05-thankyou');
            }, function() {
              // Yes
              $scope.closeThisDialog();
            });
          });
        }; // end shareViaPrint
      } // end controller
    }); // end ngDialog.open
  }; // end openImageModal
})

/* 04-share */
.controller('ShareCtrl', function(
  $scope,
  $rootScope,
  $ionicViewSwitcher,
  $http,
  $cordovaSocialSharing,
  $cordovaFile,
  Dialogs,
  Dropbox,
  $ionicLoading,
  $state) {
  console.log('```` Rendering Share');
  // $rootScope.backgroundPosX = -120;
  $scope.imgToShare = IMG_TO_SHARE;
  $scope.back = function() {
    $ionicViewSwitcher.nextDirection('back');
    $state.go('/03-gallery');
  };

  $scope.postOnTwitter = function(msgtoshare) {
    console.log("hit postOnTwitter.");
    $ionicLoading.show({
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });

    /** DOWNLOAD FILE FROM DROPBOX **/
    Dropbox.downloadFile(IMG_TO_SHARE, 'share_img.jpg', function(e, result) {
      if (e) return console.log("error downloading file.");
      console.log("img download SUCCESS. result: \n" + JSON.stringify(result, null, '\t'));
      $scope.localFile = result.nativeUrl;

      /** READ FILE AS BASE64 STRING **/
      $cordovaFile.readAsDataURL(cordova.file.documentsDirectory, 'downloadedImage.jpg') //$cordovaFile.readAsBinaryString(cordova.file.documentsDirectory, 'downloadedImage.jpg')
      .then(function(success) {
        console.log(">> Finished Encoding File as base_64"); // console.log("readAsDataURL SUCCESS: "+JSON.stringify(success, null, '\t'));
        $rootScope.codeBird.setToken(($rootScope.twitter_token).toString(), ($rootScope.twitter_secret_token).toString());
        var base_64 = success.substr(success.indexOf(",") + 1, success.length); // var base_64 = success;
        // var base_64_test_img = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB+0lEQVR42mP8//8/Ay0BEwONwagFoxZQDljI0PP8x7/Z93/e+PxXmpMpXp5dh4+ZgYHh0bd/clxYnMuINaMtfvRLgp3RVZwVU+rkuz+eRz+//wXVxcrEkKnEceXTX0dRlhoNTmKDaOvzXwHHv6x9+gtN/M9/hpjTX+GmMzAw/P7HMOnOj+ff//35x/Ds+z9iLfjPwPDt7//QE1/Sz319/RNh3PkPf+58+Yup/t7Xf9p8zFKcTMRa4CLGCrFm1v2fSjs+pJ/7uuvl7w+//yO7HRkUq3GEyrCREMk+kqy2IiyH3/xhYGD48uf/rPs/Z93/yczIwM3CiFU9Hw5xnD4ouvTt4Tf0AP37n+HTb+w+UOBmIs2CICm2R9/+EZlqGRkYzIVYSLMgRIYtUYGdSAsMBFgUuJhIy2iMDAwt2pysjAwLHv78RcgnOcrs5BQVHEyMG579Imi6Nh9zrBxZFgixMW624pXnwldYcTAzLjDhZmUit7AzE2K54c7fp8eF1QhWRobFptwmgiwkF3b//jMwMjJ8+P3/zPs/yx/9Wvr412+MgBJlZ1xsyuOOrbAibMHH3/87b32fce/nR2ypnpuFMVGevU6TQ5SdqKKeEVez5cuf/7te/j727s+9L/++/v3PzcyowM1kIcTiLs7Kz8pIfNnOONouGrVg1AIGAJ6gvN4J6V9GAAAAAElFTkSuQmCC'};
        var params = {
          'media': base_64
        };

        /** MEDIA_UPLOAD TO TWITTER **/
        $rootScope.codeBird.__call(
          'media_upload', params,
          function(reply) {
            if (reply.httpstatus == 200) {

              /** STATUS_UPDATE TO TWITTER **/
              console.log('media_upload reply: ' + JSON.stringify(reply, null, '\t'));
              params = {
                'media_ids': reply.media_id_string,
                'status': msgtoshare
              };
              $rootScope.codeBird.__call(
                'statuses_update', params,
                function(statusUpdateReply) {
                  console.log('statuses-update reply: ' + JSON.stringify(statusUpdateReply, null, '\t'));
                  if (statusUpdateReply.httpstatus == 200) {

                    /** SUCCESS, DONE **/
                    $rootScope.goToPage('/05-thankyou');
                  } else Dialogs.alert('Unable to post to Twitter. Please try again or choose another sharing option.', 'Got it');
                }
              );
            } else Dialogs.alert('Unable to post to Twitter. Please try again or choose another sharing option.', 'Got it');
          }
        );
      }, function(error) {
        console.log("readAsDataURL ERROR: " + JSON.stringify(error));
      });
    });
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
  // $rootScope.backgroundPosX = -160;

  $timeout(function() {
    PREV_NOW = new Date().getTime();
    $rootScope.startOver();
  }, 10000);

});
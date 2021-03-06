/*
 * Davinci App
 * Cordova plugins used:
 * – Device
 * – Splashscreen
 * – Statusbar
 * – Inappbrowser
 
 */
var APP_NAME          = 'DAVINCIAPP';
var APP_PASSWD        = '@volvox@';

// Dropbox API
var DROPBOX_FOLDER     = 'VVox_DaVinci_Application';
var DROPBOX_TOKEN      = localStorage['dropbox_token']  || 'oI4FaXeef54AAAAAAACQfdoh5qtGO6oVdh1FTofQYAHacQyi11SStjiANcXtgXCs';

// Correct vvv
var MANDRILL_EMAIL     = localStorage['mandrill_email'] || 'davinci@volvoxlabs.com';
var MANDRILL_TOKEN     = localStorage['mandrill_token'] || 'gRxJVxhYFO9JyWmDsvq9ow';

// Facebook APP ID
var FACEBOOK_APP_ID    = localStorage['facebook_app_id'] || '349608991915880';

// Twitter API Keys
var TWITTER_API_KEY    = localStorage['twitter_api_key'] || '0Im4waStH8fPjaxhsoxmOLuLE';
var TWITTER_SECRET_KEY = localStorage['twitter_secret_key'] || 'VqRPqUe6QsQE4cmjHDIhRljBI8GnJgB8v79Z0Uxdw5uhWHPMmr';

var EVENT_FOLDER       = localStorage['event_folder'] || 'default_event';
var EVENT_NAME;
var EVENT_LOGO;
var EVENT_BG;
var WELCOME_BG;
var EVENT_DISCLAIMER;

// Email thing
var EMAIL_TPL_REGISTER;
var EMAIL_TPL_PHOTO;
var EMAIL_PHOTO_COMPILED;

var IMG_OVERLAY;
var IMG_TO_SHARE;
var MAX_NUM_IMGS_GALLERY = 30;

var PREV_NOW = new Date().getTime();

angular.module(APP_NAME, [
  'ionic',
  'ngCordova',
  'ngDialog',
  // 'ngRetina',
  'app.controllers',
  'app.services'
])

.run(function(
  $ionicPlatform,
  $rootScope,
  $state,
  $ionicViewSwitcher,
  $timeout,
  $ionicLoading,
  $cordovaOauth,
  Dialogs,
  Dropbox,
  $cordovaDevice,
  $cordovaSplashscreen,
  $cordovaPrinter,
  $cordovaStatusbar) {

  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
    localStorage['uuid'] = '123456';
    if (window.cordova) {
      // $cordovaStatusbar.hide();
      localStorage['uuid'] = $cordovaDevice.getUUID();
    }
    console.log('```` App Ready');
    // SET GLOBAL
    $rootScope.settings = {};
    $rootScope.settings.event_folder = EVENT_FOLDER;
    $rootScope.settings.dropbox_token = DROPBOX_TOKEN;
    $rootScope.settings.mandrill_email = MANDRILL_EMAIL;
    $rootScope.settings.mandrill_token = MANDRILL_TOKEN;
    $rootScope.settings.facebook_app_id = FACEBOOK_APP_ID;
    $rootScope.settings.twitter_api_key = TWITTER_API_KEY;
    $rootScope.settings.twitter_secret_key = TWITTER_SECRET_KEY;
    $rootScope.startOver = function() {
      // Restart
      console.log('go to welcome');
      $rootScope.backgroundBg = $rootScope.welcomeBg;
      $state.go('/01-welcome');
      $timeout(function() {
        $rootScope.shouldHide = true;
      }, 500);

    };

    $rootScope.codeBird = new Codebird;
    $rootScope.codeBird.setConsumerKey( TWITTER_API_KEY, TWITTER_SECRET_KEY );
    $rootScope.codeBird.setUseProxy(false);
    // $rootScope.codeBird.setProxy("http://requestb.in/1bi5bss1");

    // TEST GET HTML
    Dropbox.getEmailTplRegister(function(res) {
      // console.log(res);
      EMAIL_TPL_REGISTER = res;
    });

    Dropbox.getEmailTplPhoto(function(res) {
      // console.log(res);
      EMAIL_TPL_PHOTO = res;
    });

    // GET ACCOUNT INFO
    Dropbox.getAccountInfo(function(result) {
      console.log(result);
    });
    Dropbox.getSettings(function(res) {
      console.log(res);

      EVENT_NAME = res.event_name;
      EVENT_LOGO = '/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/src_img/welcome_logo.png';
      WELCOME_BG = '/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/src_img/welcome_bg.jpg';
      EVENT_BG = '/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/src_img/app_bg.jpg';
      IMG_OVERLAY = '/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/src_img/overlay.png';

      $rootScope.msgToShare = res.share_comment;
      $rootScope.disclaimer = res.disclaimer;

      Dropbox.returnDirectLink(IMG_OVERLAY, function(d) {
        $rootScope.overlayImg = d;
      });

      Dropbox.returnDirectLink(EVENT_BG, function(d) {
        Dropbox.downloadFile(d, 'app_bg.jpg', function(e, result) {
          console.log("downloaded image: "+result.nativeURL);
          $rootScope.appBg = result.nativeURL;
        });
      });

      Dropbox.returnDirectLink(EVENT_LOGO, function(d) {
        Dropbox.downloadFile(d, 'event_logo.jpg', function(e, result) {
          console.log("downloaded image: "+result.nativeURL);
          $rootScope.event_logo = result.nativeURL;
        });
      });

      Dropbox.returnDirectLink(WELCOME_BG, function(d) {
        Dropbox.downloadFile(d, 'welcome_bg.jpg', function(e, result) {
          console.log("downloaded image: "+result.nativeURL);
          $rootScope.welcomeBg = result.nativeURL;
          $rootScope.backgroundBg = $rootScope.welcomeBg;
          console.log('set backgroundBg to: '+$rootScope.backgroundBg); // √
          $state.go('/01-welcome');
          // $state.go('/03-gallery');
          if (window.cordova) {
            $timeout(function() {
              $cordovaSplashscreen.hide();
            }, 1000);
          }
        });
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

  });

  $rootScope.$on('$ionicView.beforeLeave', function() {
    $rootScope.shouldHide = false;
  });

  $rootScope.$on('$ionicView.afterEnter', function() {
    // Remove Spinner
    $ionicLoading.hide();

    console.log('```` View Updated.');

  });
  // Go to page x
  $rootScope.goToPage = function(page) {

    if(page === '/02-register'){ 
      //set the BG for the rest of the app.
      $rootScope.backgroundBg = $rootScope.appBg;
      console.log('set backgroundBg to: '+$rootScope.backgroundBg); // √
    }

    var now = new Date().getTime();
    if (now - PREV_NOW > 600 * 1000 && !$rootScope.isWelcomePage) {
      // reset
      $rootScope.startOver();
    } else {
      console.log((now - PREV_NOW) / 1000);
      PREV_NOW = now;
      // Fade out
      $ionicViewSwitcher.nextDirection('forward');
      $state.go(page);
    }

  };
  // Go to settings
  $rootScope.goToSettings = function() {
    console.log('```` Auth for settings');
    // Prompt password
    Dialogs.prompt('You shall not pass...',
      function(result) {
        if (result === APP_PASSWD) {
          // GO
          $state.go('/00-settings');
        } else {
          // NOT GO
        }
      });
  };
})

.config(function(
  $ionicConfigProvider,
  $httpProvider,
  $cordovaInAppBrowserProvider,
  $stateProvider,
  $urlRouterProvider,
  $sceDelegateProvider) {

  /*
    Configurations
  */
  $sceDelegateProvider.resourceUrlWhitelist(['**']);
  $ionicConfigProvider.views.maxCache(0);
  $httpProvider.defaults.cache = false;
  var options = {
    location: 'yes',
    clearcache: 'yes',
    toolbar: 'no'
  };
  $cordovaInAppBrowserProvider.setDefaultOptions(options);

  /*
    Routing
  */

  $stateProvider
    .state('/00-settings', {
      url: "/00-settings",
      templateUrl: "views/00-settings.html",
      controller: 'SettingsCtrl'
    })
    .state('/01-welcome', {
      url: "/01-welcome",
      templateUrl: "views/01-welcome.html",
      controller: 'WelcomeCtrl'
    })
    .state('/02-register', {
      url: "/02-register",
      templateUrl: "views/02-register.html",
      controller: 'RegisterCtrl'
    })
    .state('/03-gallery', {
      url: "/03-gallery",
      templateUrl: "views/03-gallery.html",
      controller: 'GalleryCtrl'
    })
    .state('/04-share', {
      url: "/04-share",
      templateUrl: "views/04-share.html",
      controller: 'ShareCtrl'
    })
    .state('/05-thankyou', {
      url: "/05-thankyou",
      templateUrl: "views/05-thankyou.html",
      controller: 'ThankYouCtrl'
    });
})

// Filters

.filter('trusted', ['$sce',
  function($sce) {
    return function(url) {
      return $sce.trustAsResourceUrl(url);
    };
  }
]);

Array.prototype.chunk = function(chunkSize) {
  var array = this;
  return [].concat.apply([],
    array.map(function(elem, i) {
      return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
    })
  );
};

function getEventName() {
  return EVENT_NAME;
}

function getEventFolder() {
  return EVENT_FOLDER;
}

function getEventDisclaimer() {
  return EVENT_DISCLAIMER;
}
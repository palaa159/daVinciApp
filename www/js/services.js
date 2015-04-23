angular.module('app.services', [])

/* Dropbox */
.factory('Dropbox', function($http, $rootScope,$timeout,$cordovaFileTransfer) {
    var service = {};

    service.getAccountInfo = function(cb) {
        $http.get('https://api.dropbox.com/1/account/info', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).then(function(result) {
            cb(result.data);
        });
    };

    service.getSettings = function(success, fail) {
        console.log('````` Get settings.json');
        $http.get('https://api-content.dropbox.com/1/files/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/settings.json', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        })
            .success(function(res) {
                success(res);
            })
            .error(function(err) {
                fail(err);
            });
    };

    service.getEmailTplRegister = function(cb) {
        $http.get('https://api-content.dropbox.com/1/files/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/email/registration_email.html', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).then(function(result) {
            if (cb) cb(result.data);
        });
    };

    service.getEmailTplPhoto = function(cb) {
        $http.get('https://api-content.dropbox.com/1/files/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/email/share_email.html', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).then(function(result) {
            if (cb) cb(result.data);
        });
    };

    service.getImages = function(cb) {
        $http.get('https://api.dropbox.com/1/metadata/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/social_gallery', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).then(function(result) {
            // return links via Dropbox media api
            $rootScope.gallery = [];
            var unorderedGallery = []; 
            async.each(result.data.contents, function(content, callback) {
                service.returnDirectLink(content.path, function(result) {
                    var thisImg = { path: content.path, link: result};
                        /* example: 
                        * { "path": "/VVox_DaVinci_Application/default_event/social_gallery/Two-Kittens-500x500 copy 2.jpg",
                        *   "link": "https://www.dropbox.com/s/y9ca6y0c36hloy0/Two-Kittens-500x500%20copy%202.jpg?raw=1" }
                        */
                    unorderedGallery.push(thisImg);
                    callback();
                });
            }, function(err) {
                if (err) {
                    console.log(err);
                    cb(err);
                }
                //console.log("UNORDEREDGALLERY: \n"+JSON.stringify(unorderedGallery, null, '\t'));
                $rootScope.gallery = _.pluck(_.sortBy(unorderedGallery, 'path'), 'link');
                console.log("$rootScope.gallery: \n"+JSON.stringify($rootScope.gallery, null, '\t'));
                if(cb) cb();
            });
        });
    };

    service.downloadFile = function(imgurl, cb){
      var targetPath = cordova.file.documentsDirectory + "downloadedImage.png";
      var trustHosts = true
      var options = {};
      console.log("hit downloadDropboxFile: "+imgurl);
      $cordovaFileTransfer.download(imgurl, targetPath, options, trustHosts)
      .then(function(result) {
        // Success!
        cb(null,result);
      }, function(err) {
        console.log('img download FAIL. err: \n'+JSON.stringify(err));
        cb(err);
      }, function (progress) {
        $timeout(function () {
          //$scope.downloadProgress = (progress.loaded / progress.total) * 100;
          // console.log("download progress: "+ $scope.downloadProgress);
        });
      });
    };

    service.appendUser = function(name, email, cb) {

        $http.get('https://api-content.dropbox.com/1/files/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/users/users_' + localStorage['uuid'] + '.json', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).success(function(res) {
            // console.log(res);
            var arrayOfUsers = res;
            arrayOfUsers.push({
                name: name,
                email: email
            });
            var arrayOfUsersUpdated = JSON.stringify(arrayOfUsers);
            $http({
                method: 'PUT',
                url: 'https://api-content.dropbox.com/1/files_put/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/' + 'users/users_' + localStorage['uuid'] + '.json?access_token=' + DROPBOX_TOKEN,
                data: arrayOfUsersUpdated
            }).success(function(data, status, headers, config) {
                console.log(data);
                if (cb) cb();
            }).error(function(data, status, headers, config) {

            });
            // get file and append to array

        }).error(function(err) {
            // console.log(err);
            if (err.error == 'File not found') {
                // create a new file
                var toAdd = [{
                    name: name,
                    email: email
                }];
                toAdd = JSON.stringify(toAdd);
                $http({
                    method: 'PUT',
                    url: 'https://api-content.dropbox.com/1/files_put/auto/' + DROPBOX_FOLDER + '/' + getEventFolder() + '/' + 'users/users_' + localStorage['uuid'] + '.json?access_token=' + DROPBOX_TOKEN,
                    data: toAdd
                }).success(function(data, status, headers, config) {
                    console.log(data);
                    console.log('file uploaded successfully');
                }).error(function(data, status, headers, config) {

                });
            }
        });
    };

    // Helper
    service.returnDirectLink = function(path, cb) {
        // "/davinci_app/test_event/photobooth/6a010535647bf3970b015390876439970b-500wi.jpg"
        var link;
        $http.get('https://api.dropbox.com/1/shares/auto' + path + '?short_url=false', {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).then(function(result) {
            var toReturn = result.data.url;
            toReturn = toReturn.replace('?dl=0', '?raw=1');
            if (cb) cb(toReturn);
        });
    };

    return service;
})

/* Mandrillapp */
.factory('Mandrill', function() {
    var service = {};

    service.sendMail = function(name, email, cb) {
        var m = new mandrill.Mandrill(MANDRILL_TOKEN);
        var params = {
            "message": {
                "from_email": MANDRILL_EMAIL,
                "to": [{
                    "email": email
                }],
                "subject": "Volvox DaVinci",
                "html": EMAIL_TPL_REGISTER
            }
        };

        m.messages.send(params, function(res) {
            console.log(res);
            if (cb) cb();
        }, function(err) {
            console.log(err);
        });
    };

    service.sharePhoto = function(name, email, cb) {
        var m = new mandrill.Mandrill(MANDRILL_TOKEN);

        var params = {
            "message": {
                "from_email": MANDRILL_EMAIL,
                "to": [{
                    "email": email
                }],
                "subject": "Your photo",
                "html": EMAIL_PHOTO_COMPILED
            }
        };
        m.messages.send(params, function(res) {
            console.log(res);
            if (cb) cb();
        }, function(err) {
            console.log(err);
        });
    };

    return service;
})

/* Dialogs */
.factory('Dialogs', function($ionicPopup, $cordovaDialogs) {
    var service = {};

    service.alert = function(message, buttonName, cb) {
        $cordovaDialogs.alert(message, getEventName(), buttonName).then(function() {
            if (cb) cb();
        });
    };

    service.confirm = function(message, buttonArray, cancel, ok) {
        $cordovaDialogs.confirm(message, getEventName(), buttonArray).then(function(buttonIndex) {
            if (buttonIndex == 1) {
                // Cancel
                if (cancel) cancel();
            } else if (buttonIndex == 2) {
                // OK
                if (ok) ok();
            }
        });
    };

    service.prompt = function(msg, cb) {
        $ionicPopup.prompt({
            title: 'Password Check',
            template: 'Enter your secret password',
            inputType: 'password',
            inputPlaceholder: 'Your password'
        }).then(function(res) {
            cb(res);
        });
    };

    return service;
});
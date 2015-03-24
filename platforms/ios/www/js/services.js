angular.module('app.services', [])

/* Dropbox */
.factory('Dropbox', function($http, $rootScope) {
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
            // TODO: Async
            var i = 0;
            async.each(result.data.contents, function(content, callback) {
                function callback() {
                    // console.log(result.data.contents.length, i);
                    if (i === result.data.contents.length - 1) {
                        // console.log('Done');
                        if (cb) cb();
                    } else {
                        i++;
                    }
                }
                service.returnDirectLink(content.path, function(result) {
                    $rootScope.gallery.push(result);
                    callback();
                });
            }, function(err) {
                if (err) {
                    console.log(err);
                }
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
        $http.get('https://api.dropbox.com/1/media/auto' + path, {
            headers: {
                'Authorization': 'Bearer ' + DROPBOX_TOKEN
            }
        }).then(function(result) {
            if (cb) cb(result.data.url);
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

Volvox Labs' DaVinci Photobooth App
===

Event-based photo sharing application, built with [ionic](http://ionicframework.com)

##platform add instructions
1. edit `plugins/ios.json`:
  * remove all values for `installed_plugins` __except__ 
  ```
  "com.phonegap.plugins.facebookconnect": {
    "APP_ID": "01234567890",
    "APP_NAME": "MyAppName",
    "PACKAGE_NAME": "com.ionicframework.myappname"
	}
  ```
2. `$ ionic platform add ios | android

##Supported APIs
* Dropbox auth, get and post files
* Twitter auth, post with image
* Facebook auth, post with image
* Mandrill E-mail send html emails
* AirPrint

##Credits
Joe Saavedra + Apon Palanuwech for Volvox Labs.
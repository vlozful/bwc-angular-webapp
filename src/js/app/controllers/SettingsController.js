import angular from "angular";
import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";
import SessionService from "../services/SessionService";

var $apiService,
    $sessionService,
    $location;

function checkOnSubmit(form, model) {
  angular.forEach(model, function(value, key) {
    var field = form[key];
    field.$setTouched();
    field.$setDirty();
  });

  if (form.$invalid) {
    alert('Invalid data');
  }

  return form.$invalid;
}

export default BaseController.extend('SettingsController', {
  
  constructor: function(_$scope, _$apiService, _$sessionService, _$location) {
    $apiService = _$apiService;
    $sessionService = _$sessionService;
    $location = _$location;
    this._super([_$scope]);
  },

  defineScope: function(_$scope) {

    var extension = {
      'model': {
            'oldpassword': '',
            'password': '',
            'password1': ''
          },
      'idLanguage': $sessionService.languageID,
      'changePassword': function(model) {
          var form = _$scope['settingsForm'];

          angular.forEach(model, function(value, key) {
            var field = form[key];
            field.$setTouched();
            field.$setDirty();
          });

          if (form.$invalid) {
            alert('Invalid data');
          } else {
            var _resetForm = function() {
              model['oldpassword'] = model['password'] = model['password1'] = '';
              form.$setUntouched();
            };
            $apiService.changePassword(model['oldpassword'], model['password'])
                .then(function() {
                    _resetForm();
                    alert('Your password was succesfully changed');
                }, function(err) {
                    console.log(err);
                    _resetForm();
                });
          }
      },
      'changeLang': function() {
            $apiService.sessionsIdLanguage(_$scope['idLanguage'])
                .then(function() {
                  window.location.reload(true);
                });
          }
    };

    angular.extend(_$scope, extension);
  }
}).inject(ApiService.fullName, SessionService.fullName, '$location');
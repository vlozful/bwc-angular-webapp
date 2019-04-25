import angular from 'angular';
import BaseController from "../core/BaseController";
import AuthService from "../services/AuthService";
import SessionService from "../services/SessionService";

var $authService, $countries;

export default BaseController.extend('RegisterController', {
  constructor: function(_$scope, _$authService, _countries) {
    $authService = _$authService;
    $countries = _countries;
    this._super([_$scope]);
  },

  defineScope: function(_$scope) {
    _$scope['countries'] = $countries;
    _$scope['regInfo'] = {
      'idLanguage': '',
      'email': '',
      'password': '',
      'password1': '',
      'country': ''
    };
    _$scope['register'] = function(regInfo) {
      var form = _$scope['registerForm'];

      angular.forEach(regInfo, function(value, key) {
        var field = form[key];
        field.$setTouched();
        field.$setDirty();
      });

      if (form.$invalid) {
        alert('Invalid data');
      } else {
        $authService.register(regInfo)
          .then(function() {
              _$scope['navigate']['reloadHome'](true);
            });
      }
    };
  }
}).inject(AuthService.fullName, 'data');
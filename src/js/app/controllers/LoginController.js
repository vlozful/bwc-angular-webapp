import angular from "angular";
import BaseController from "../core/BaseController";
import AuthService from "../services/AuthService";

var $authService;

export default BaseController.extend('LoginController', {

  constructor: function(_$scope, _$authService) {
    $authService = _$authService;

    this._super([_$scope]);
  },

  defineScope: function(_$scope) {
    _$scope['credentials'] = {'email': '', 'password': ''};
    _$scope['login'] = function(credentials) {

      var form = _$scope['loginForm'];

      angular.forEach(credentials, function(value, key) {
        var field = form[key];
        field.$setTouched();
        field.$setDirty();
      });
      if (form.$invalid) {
        alert('Invalid data');
      } else {
        $authService.login(credentials)
          .then(
            function() {
              _$scope['navigate']['home']();
            },
            function(error) {
              console.log(error);
            });
      }
    };
  }
}).inject(AuthService.fullName);

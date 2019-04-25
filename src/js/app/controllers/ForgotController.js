import angular from "angular";
import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";

var $apiService, $location;

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

function getHashCode(model) {
  var _scope = this,
      form = _scope['restoreForm'];

  if (!checkOnSubmit(form, model)) {
      $apiService.getHashCode(model['email'])
      .then(function() {
          _scope['state']['value'] = 2;
        });
  }
}

export default BaseController.extend('ForgotController', {
    constructor: function(_$scope, _$apiService, _$location) {
      $apiService = _$apiService;
      $location = _$location;
      this._super([_$scope]);
    },

    defineScope: function(_$scope) {
      var extension = {
        'restoreModel': {'email': ''},
        'passwordsModel': {'hash': $location.search()['hash'], password1: '', password2: ''},
        'state': {'value': ($location.search()['hash']) ? 2 : 1},
        'getHashCode': getHashCode,
        'restore': function(model) {
          $apiService.restorePassword(model['hash'], model['password1'])
            .then(function() {
                _$scope['navigate']['login']();
              });
        }
      };

      angular.extend(_$scope, extension);
    }
  }).inject(ApiService.fullName, '$location');

import angular from 'angular';
import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";

var $route,
    $apiService,
    $timeout;

export default BaseController.extend('OrderController', {

  orderId: '',

  order: '',

  constructor: function(_$scope, _$route, _$apiService, _$timeout) {
    $route = _$route;
    $apiService = _$apiService;
    $timeout = _$timeout;
    this.orderId = _$route.current.params['id'];
    this._super([_$scope]);
    this.checkStatus();
  },

  defineScope: function(_$scope) {
    var self = this,
        ext = {
          'order': {},
          'books': [],
          'action': function(order_status) {
            switch (order_status) {
              case '1': self.checkStatus(); break;
              case '2': _$scope['navigate']['home'](); break;
              default: alert('Not implemented yet');
            }
          }
        };

    angular.extend(_$scope, ext);
  },

  checkStatus: function() {
    var controller = this;
    $apiService.getOrderStatus(this.orderId)
      .then(function(data) {
          data[0]['items'].forEach(function(item) {
            controller.$scope['books'].push(new Book(item['book']));
          });
          $timeout(function() {
            controller.order = controller.$scope['order'] = data[0];
          }, 50);
        });
  }
}).inject('$route', ApiService.fullName, '$timeout');

import angular from "angular";
import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";

var $route;
export default BaseController.extend('ListController', {

  buffer: '',

  fetchAll: true,

  addToScope: '',

  index: 'id',

  apiService: '',

  api: '', //OVERRIDE

  param: '',

  something: this,

  constructor: function(_$scope, _$route, _$apiService) {
    $route = _$route;
    this.param = $route.current.params['id'];
    this.apiService = _$apiService;
    if (!angular.isArray(this.buffer)) this.buffer = [];
    this._super([_$scope]);
  },

  defineScope: function(_$scope) {
    var self = this;
    _$scope['provider'] = self.getDataProvider();
    angular.forEach(this.addToScope, function(value, key) {
      _$scope[key] = value;
    });
  },

  fetch: function(index, count) {
    var api = this.api;
    if (!api) throw ('No api specified');
    var promise = api(index, count, this.param);
    promise.then(this.parseResponse.bind(this));
    return promise;
  },

  parseResponse: function(response) {
    return response; //OVERRIDE
  },

  getDataProvider: function() {
    var self = this;

    return {
      'get': function(index, count, successCallBack) {
        var start = Math.max(0, index),
            end = index + count - 1,
            buffer = self.buffer,
            haveDataInBuffer = true,
            i;

        function returnEmpty() {
          successCallBack([]);
        }

        function returnFromBuffer() {
          return buffer.slice(start, end + 1);
        }

        if (start > end) {
          returnEmpty();
          return;
        }

        if (self.fetchAll) {
          // In the case of fullData response
          if (buffer.length) {
            // If already fetched
            successCallBack(returnFromBuffer());
          } else {
            self.fetch()
              .then(function(data) { // success
                    buffer = self.buffer = data;
                    successCallBack(returnFromBuffer());
                  }, function(error) { // error
                    returnEmpty();
                });
          }
        } else {
          //fetch by start/end
          //check if we have already data in buffer
          for (i = start; i <= end; i++) {
            if (!buffer[i]) {
              haveDataInBuffer = false;
              break;
            }
          }

          if (haveDataInBuffer) {
            successCallBack(returnFromBuffer());
            return;
          }
          //if not
          //workaround on first request starting from 1
          self.fetch(start, end + 1)
              .then(function(data) { //success
                for (i = 0; i < data.length; i++) {
                  self.buffer[start + i] = data[i];
                }
                //no more fetching if fetched all data
                if (data.length < (end - start + 1) && !self.fetchAll) {
                  self.fetchAll = true;
                  for (i = 0; i < buffer.length; i++) {
                    if (!angular.isDefined(buffer[i])) {
                      self.fetchAll = false;
                      break;
                    }
                  }
                }
                successCallBack(returnFromBuffer());
              }, function(error) { //error
                returnEmpty();
            });
        }
      }
    };
  }
}).inject('$route', ApiService.fullName);

import angular from "angular";
import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";

var $apiService, $route;
export default BaseController.extend('BookDetailsController', {

    constructor: function(_$scope, _$apiService, _$route) {
        $apiService = _$apiService;
        $route = _$route;
        this._super([_$scope]);
    },

    getBookData: function(_scopeObj) {
        var promise = $apiService.getBookDetails($route.current.params['id']);
        promise.then(function(data) {
            angular.forEach(data, function(value, key) {
                _scopeObj[key] = value;
            });
            var summary = data['summary'],
                shortSummary = summary.substring(0, 180);

            if (shortSummary.length == summary.length) _scopeObj['fullSummary'] = summary; else _scopeObj['shortSummary'] = shortSummary + '...';
        });
        return promise;
    },

    defineScope: function(_$scope) {
        var scopeExtension = {
        'book': {},
        'showSummary': function() {
            var info = _$scope['book'];
            info['shortSummary'] = '';
            info['fullSummary'] = info['summary'];
        }
        };

        angular.extend(_$scope, scopeExtension);
        this.getBookData(_$scope['book']);
    }
}).inject(ApiService.fullName, '$route');
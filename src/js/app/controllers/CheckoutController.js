import angular from "angular";
import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";

var $apiService, $route, $q;
export default BaseController.extend('CheckoutController', {

    constructor: function(_$scope, _$apiService, _$route, _$q) {
        $apiService = _$apiService;
        $route = _$route;
        $q = _$q;
        this._super([_$scope]);
    },

    getBookData: function(_scopeObj) {
        var promise = $apiService.getBookDetails($route.current.params['id']);
        promise.then(function(data) {
            console.log('checkoutData: ', data);
            angular.forEach(data, function(value, key) {
                    _scopeObj[key] = value;
                });
        });
        return promise;
    },

    defineScope: function(_$scope) {
        var scopeExtension = {
            'book': {},
            'card': {'owner': '', 'number': '', 'mm': '', 'yy': ''},
            'checkout': function(card) {
                var form = _$scope['checkoutForm'];
                angular.forEach(card, function(value, key) {
                        var field = form[key];
                        field.$setTouched();
                        field.$setDirty();
                    });
                if (form.$invalid) {
                    alert('Invalid data');
                } else {
                    $apiService.getBrainTreeClientToken()
                        .then(function(token) {
                            var deferred = $q.defer(),
                                card = _$scope['card'],
                                client;
                            try {
                                    client = new window['braintree']['api']['Client']({'clientToken': token});
                                    client['tokenizeCard']({
                                                'number': card['number'],
                                                'cardholderName': card['owner'],
                                                'expirationMonth': card['mm'],
                                                'expirationYear': card['yy']
                                            }, function(err, nonce) {
                                                    if (err) {
                                                        deferred.reject(err);
                                                    } else {
                                                        deferred.resolve(nonce);
                                                    }
                                                });
                                } catch (e) {
                                    deferred.reject(e.message);
                                }

                            deferred.promise.then(function(_btToken) {
                                    $apiService.buy(_$scope['book']['id'], _btToken).then(
                                        function(order_id) {
                                            _$scope['navigate']['order'](order_id);
                                        }
                                    );
                                }, function(error) {
                                    alert(error);
                                });

                        });
                }
            }
        };

        angular.extend(_$scope, scopeExtension);
        this.getBookData(_$scope['book']);
    }
}).inject(ApiService.displayName, '$route', '$q');

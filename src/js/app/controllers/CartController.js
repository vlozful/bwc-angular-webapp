import BaseController from "../core/BaseController";
import CartService from "../services/CartService";
import ApiService from "../modules/api/ApiService";

var $cartService, $apiService, $q;

export default BaseController.extend('CartController', {

  constructor: function(_$scope, _$cartService, _$apiService, _$q) {
    $apiService = _$apiService;
    $q = _$q;
    $cartService = _$cartService;
    this._super(arguments);
  },

  defineScope: function(_$scope) {
    var scopeExtension = {
      'items': $cartService.getItems,
      'removeItem': function(item) {
        $cartService.remove(item);
      },
      'showForm': function() {
        this['formVisible']['value'] = true;
      },
      'price': $cartService.getPrice,
      'VAT': $cartService.getVAT,
      'total': $cartService.getTotal,
      'formVisible': {'value': false},
      'card': {'owner': '', 'number': '', 'mm': '', 'yy': ''},
      'checkout': function(card) {
        var form = this['checkoutForm'];
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
                var deferred = $q.defer(), card = _$scope['card'], client;
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

                deferred.promise
                  .then(function(_btToken) {
                      $apiService.buy(null, _btToken)
                        .then(function(order_id) {
                            $cartService.clear();
                            _$scope['navigate']['order'](order_id);
                          }
                      );
                    },
                    function(error) {
                      alert(error);
                    }
                );

              });
        }
      }
    };

    angular.extend(_$scope, scopeExtension);
  }
}).inject(CartService.fullName, ApiService.fullName, '$q');

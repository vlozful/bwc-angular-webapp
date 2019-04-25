import angular from "angular";
import AC from "../core/AngularClass";

  var $apiService,
      $rootScope,
      items;

export default AC.extend('CartService', {

  _cartWasRead: false,

  isReady: function() {
    if (!$rootScope['status']['offline'] && !$rootScope['trial']) {
      if (this._cartWasRead) return true;
      return this.getItemsFromServer();
    }
    return true;
  },

  constructor: function(_$rootScope) {
    $rootScope = _$rootScope;
    items = [];
  },

  setApiService: function(_$apiService) {
    $apiService = _$apiService;
  },

  add: function(book) {
    var self = this;
    return $apiService.addCartItem(book)
        .then(function() {
          self.getItemsFromServer().then(function() {
            book['inCart'] = true;
          });
    });
  },

  remove: function(cartItem) {
    var self = this;
    return $apiService.removeCartItem(cartItem)
        .then(function() {
          return self.getItemsFromServer();
        });
  },

  getItems: function() {
    return items;
  },

  getPrice: function() {
    var price = 0;
    items.forEach(function(item) {
      price += item['price'];
    });

    if (price > 0 && items[0] && items[0]['currency']) price = price + ' ' + items[0]['currency'];
    return price;
  },

  getVAT: function() {
    var VAT = 0;
    items.forEach(function(item) {
      VAT += item['VAT'];
    });

    if (VAT > 0 && items[0] && items[0]['currency']) VAT = VAT + ' ' + items[0]['currency'];

    return VAT;
  },

  getTotal: function() {
    var total = 0;
    items.forEach(function(item) {
      total += item['VAT'];
      total += item['price'];
    });
    if (total > 0 && items[0] && items[0]['currency']) total = total + ' ' + items[0]['currency'];

    return total;
  },

  getItemsFromServer: function() {
    var self = this;
    return $apiService.getCartItems()
        .then(function(_items) {
          items = angular.copy(_items);
          self._cartWasRead = true;
          return items;
        }
    );
  },

  clear: function() {
    items = [];
  },

  calc: function() {
    return items.length;
  },

  check: function(book) {
    var i = 0, result = false, m = items.length;
    for (; i < m; i++) {
      if (book['id'] === items[i]['book']['id']) {
        result = true;
        book['inCart'] = true;
        break;
      }
    }

    return result;
  }

}).inject('$rootScope')
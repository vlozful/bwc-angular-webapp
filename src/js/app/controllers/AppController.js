'use strict';
import angular from "angular";
import BaseController from "../core/BaseController";
import CartService from "../services/CartService";
import ApiService from "../modules/api/ApiService";

function setMenuState(state) {
  menuState['opened'] = !!state;
}

function toggleMenuState() {
  setMenuState(!menuState['opened']);
}

function doNavigate(path, params) {
  setMenuState();
  if (params) {
    $location.search(params);
  } else {
    $location['$$search'] = {};
  }
  return $location.path(path);
}

function togglePopup() {
  var popup = this.$scope['popup'];
  popup['active'] = !popup['active'];
  this.$scope.$apply();
}

function downLoadHandler(progressEvent) {
  var progress = Math.floor(progressEvent['loaded'] * 100 / progressEvent['total']);
  this['loading'] = {'progress': String(progress)};
  if (progress == 100) this['loading'] = {progress: ''};
  if (!this['$$phase']) this.$apply();
}

function addToCart(book, $event) {
  if (book['inCart']) return;
  $cartService.add(book);
  //prevent navigation and generating MouseEvent;
  $event.preventDefault();
  $event.cancelBubble = true;
  console.log('added to cart', book);
}

function addToMyBooks(book, $event) {
  $event.preventDefault();
  $event.cancelBubble = true;
  if (book['isMyBook']) return;
  $apiService.addTrialBook(book.id)
    .then(function() {
        book['isMyBook'] = true;
        console.log('added to myBooks', book);
        $ngDialog['open']({
          'template': 'bookadded',
          'showClose': false,
          'className': 'popup-default'
        });
      });

}

var menuState = {'opened': false},
    $rootScope,
    $scope,
    $window,
    navigate = {
      'order': function(order_id) {doNavigate('/nav/order/' + order_id)},
      'login': function() {doNavigate('/login')},
      'reloadHome': function(fromServer) {
        $rootScope.$on('$locationChangeSuccess', function(e) {
          console.log('changeSuccess', e);
          window.location.reload(fromServer);
        });
        try {
          window['applicationCache']['update']();
        } catch (e) {
          console.log(e);
        } finally {
          doNavigate('/nav/shelf');
        }
      },
      'home': function($event) {
        if ($event) {
          $event.preventDefault();
          $event.cancelBubble = true;
        }
        doNavigate('/nav/shelf');
      },
      'back': function() {$window.history.back()},
      'top': function() {doNavigate('/nav/top')},
      'genres': function() {doNavigate('/nav/genres')},
      'new': function() {doNavigate('/nav/new')},
      'cart': function() {doNavigate('/nav/cart')},
      'registration': function() {doNavigate('/registration')},
      'forgot': function() {doNavigate('/forgot')},
      'settings': function() {doNavigate('/nav/settings')},
      'showGenreBooks': function(genre) {doNavigate('/nav/genres/' + genre['id'])},
      'showBook': function(book) {doNavigate('/nav/book/' + book['id'])},
      'buyBook': function(book) {doNavigate('/nav/book/' + book['id'] + '/buy')},
      'readBook': function(book) {doNavigate('/nav/book/' + book['id'] + '/read')},
      'previewBook': function(book) {doNavigate('/nav/book/' + book['id'] + '/preview')},
      'langs': function() {doNavigate('/nav/languages')},
      'showLangBooks': function(lang) {doNavigate('/nav/languages/' + lang['id'])},
      'terms': function() {doNavigate('/nav/terms')},
      'about': function() {doNavigate('/nav/about')},
      'cookies': function() {doNavigate('/nav/cookies')},
      'search': function(value) {var params = value ? {'str': value} : ''; doNavigate('/nav/search', params)},
      'closecookie': function() {
        document.cookie = 'haveRead=1;expires=Fri, 31 Dec 9999 23:59:59 GMT';
        $rootScope['status']['nocookieconfirm'] = false;
      },
      'go': function(path) {
        doNavigate(path);
      }
    },
    $location,
    $cartService,
    $apiService,
    $ngDialog,
    $getText,
    $settings,
    $sce;

    export default BaseController.extend('AppController', {
      constructor: function(_$scope, _$location, _version, _$storageService, _$rootScope, _$window, _$cartService, _$apiService, _settings, _$getText, _$sce, _$ngDialog) {
        $scope = _$scope;
        $location = _$location;
        $rootScope = _$rootScope;
        $cartService = _$cartService;
        $apiService = _$apiService;
        $settings = _settings;
        $window = _$window;
        $ngDialog = _$ngDialog;
        $getText = _$getText;
        $sce = _$sce;
        var appver = _version['value'];

        console.log('Application version: ', appver);
        //console.log('Using driver: ' + window['localforage']['driver']());

        //to stop spinner
        _$apiService.getSession();

        _$storageService.getItem('appver').then(
            function(storedVersion) {
              if (storedVersion !== appver) {
                _$storageService.clear().then(function() {
                  _$storageService.setItem('appver', appver);
                });
              }
            });

        this._super([_$scope]);

        if (_settings.isDeveloper) {
          window['appController'] = this;
          this.togglePopup = togglePopup.bind(this);
        }
      },

      defineScope: function(_$scope) {
        var scopeExtension = {
          'log': function(arg) {
            window.console.log(arg);
          },
          'popup': {'active': false},
          'navigate': navigate,
          'menuState': menuState,
          'addToCart': addToCart,
          'addToMyBooks': addToMyBooks,
          'toggleMenu': toggleMenuState,
          'closeMenu': function() {
            setMenuState();
          },
          'rtlDir': {
            'value': $settings.isRTL ? 'rtl' : 'ltr'
          },
          'cartItems': $cartService.calc,
          'loading': {'progress': ''},
          'ondownload': downLoadHandler.bind(_$scope)
        };
        $rootScope['g'] = {
          't': function(arg) {
            var result = $getText['getString'](arg);
            if (arg.match('##')) {
              return $sce.trustAsHtml(result);// htmlDecode(result)
            }
            return result;
          } //for translations
        };

        angular.extend(_$scope, scopeExtension);
      }
    }).inject('$location', 'version', '$localForage', '$rootScope', '$window', CartService.fullName, ApiService.fullName, 'settings', 'gettextCatalog', '$sce', 'ngDialog');
import angular from "angular";
import "angular-route";
import "./lib/angular-touch";
import "angular-gettext";

import "localforage";
import "angular-localforage";
import 'ng-dialog';

import API from "./app/modules/api";
import UISCROLL from "./lib/ui-scroll";

import RouteResolver from "./app/RouteResolver";
import BaseController from "./app/core/BaseController";
import ApplicationController from "./app/controllers/AppController";
import LoginController from "./app/controllers/LoginController";
import ForgotController from "./app/controllers/ForgotController";
import RegisterController from "./app/controllers/RegisterController";
import MyBooksController from "./app/controllers/MyBooksController";
import GenresController from "./app/controllers/GenresController";
import GenreBooksController from "./app/controllers/GenreBooksController";
import LanguagesController from "./app/controllers/LanguagesController";
import LanguageBooksController from "./app/controllers/LanguageBooksController";
import BookDetailsController from "./app/controllers/BookDetailsController";
import NewBooksController from "./app/controllers/NewBooksController";
import SearchController from "./app/controllers/SearchController";
import ReaderController from "./app/controllers/ReaderController";
import PreviewController from "./app/controllers/PreviewController";
import CheckoutController from "./app/controllers/CheckoutController";
import OrderController from "./app/controllers/OrderController";
import SettingsController from "./app/controllers/SettingsController";
import TopBooksController from './app/controllers/TopBooksController';
import QRController from "./app/controllers/QRController";
import CartController from "./app/controllers/CartController";
import ListController from "./app/core/ListController";
import BookFactory from "./app/factories/BookFactory";
import SessionService from "./app/services/SessionService";
import AuthService from "./app/services/AuthService";
import CompareD from "./app/directives/compareTo";
import EpubReaderD from "./app/directives/epub-reader";
import SliderD from "./app/directives/slider";
import FontSizeD from "./app/directives/fontSize";
import "./lib/RouteSegment";
import "./lib/jqlite-add";

import ApiService from "./app/modules/api/ApiService";
import CartService from "./app/services/CartService";

//because auto-ng-template does not see includes
import '../templates/booklist.tmpl.html'



function resolveRoute() {
  return {
    'resolve': {
      ready: ['$q', AuthService.fullName, CartService.fullName, function($q, $authService, $cartService) {
        var deferred = $q.defer();
        $authService.isLoggedIn()
            .then(function(ok) {
                console.log('logged in');
                var cartIsReady = $cartService.isReady();

                if (cartIsReady === true) {
                  console.log('CartService is ready');
                  deferred.resolve();
                } else {
                  cartIsReady.then(function(ok) {
                    console.log('CartService is ready');
                    deferred.resolve();
                  }, function(err) {
                    console.log('CartService not ready');
                    deferred.reject('cartService');
                  });
                }
            }, function() {
                  $authService.wasLoggedIn().then(function(cr) {
                    if (!cr)
                      deferred.reject('registration');
                    else
                      deferred.reject('login');
                  });
            });
        return deferred.promise;
      }
      ]}
  };
}

function routerConfig($routeSegmentProvider, $routeProvider) {

  $routeSegmentProvider
    .when('/', 'root', {redirectTo: '/nav/shelf'})
    .when('/login', 'login')
      .segment('login', {
        templateUrl: '../templates/login.tmpl.html',
        controller: LoginController
      })
    .when('/registration', 'registration')
      .segment('registration', {
        templateUrl: '../templates/registration.tmpl.html',
        controller: RegisterController,
        resolve: RouteResolver.COUNTRIES,
        untilResolved: {
          template: ''
        }
      })
    .when('/forgot', 'forgot')
      .segment('forgot', {
        templateUrl: '../templates/forgot.tmpl.html',
        controller: ForgotController
      })
    .when('/nav/book/:id/ssid/:ssid/read', 'nav.readwithssid')
    .when('/nav/shelf', 'nav.shelf', resolveRoute())
    .when('/nav/new', 'nav.new', resolveRoute())
    .when('/nav/top', 'nav.top', resolveRoute())
    .when('/nav/genres', 'nav.genres', resolveRoute())
    .when('/nav/languages', 'nav.languages', resolveRoute())
    .when('/nav/qr/:id', 'nav.qr', resolveRoute())
    .when('/nav/languages/:id', 'nav.languagebooks', resolveRoute())
    .when('/nav/genres/:id', 'nav.genrebooks', resolveRoute())
    .when('/nav/book/:id', 'nav.bookinfo', resolveRoute())
    .when('/nav/book/:id/preview', 'nav.bookpreview', resolveRoute())
    .when('/nav/book/:id/read', 'nav.bookread', resolveRoute())
    .when('/nav/book/:id/preview', 'nav.bookpreview', resolveRoute())
    .when('/nav/order/:id', 'nav.order', resolveRoute())
    .when('/nav/search', 'nav.search', resolveRoute())
    .when('/nav/cart', 'nav.cart', resolveRoute())
    .when('/nav/terms', 'nav.terms')
    .when('/nav/cookies', 'nav.cookies')
    .when('/nav/about', 'nav.about')
    .when('/nav/settings', 'nav.settings', resolveRoute())
    .segment('nav', {
        templateUrl: '../templates/nav.tmpl.html'
      })
      .within()
        .segment('readwithssid', {
            templateUrl: '../templates/reader.tmpl.html',
            controller: ReaderController
          })
        .segment('terms', {
            templateUrl: '../templates/terms.tmpl.html',
            controller: BaseController
          })
        .segment('cookies', {
            templateUrl: '../templates/cookies.tmpl.html'
          })
        .segment('about', {
            templateUrl: '../templates/about.tmpl.html'
          })
        .segment('cart', {
            templateUrl: '../templates/cart.tmpl.html',
            controller: CartController
          })
        .segment('settings', {
            templateUrl: '../templates/settings.tmpl.html',
            controller: SettingsController
          })
        .segment('shelf', {
            templateUrl: '../templates/mybooks.tmpl.html',
            controller: MyBooksController
          })
        .segment('genres', {
            templateUrl: '../templates/genres.tmpl.html',
            controller: GenresController,
            resolve: RouteResolver.GENRES,
            untilResolved: { template: '' }
          })
        .segment('new', {
            templateUrl: '../templates/newbooks.tmpl.html',
            controller: NewBooksController
          })
        .segment('top', {
            templateUrl: '../templates/topbooks.tmpl.html',
            controller: TopBooksController
          })
        .segment('genrebooks', {
            templateUrl: '../templates/dynamicbooks.tmpl.html',
            controller: GenreBooksController,
            resolve: RouteResolver.GENREBOOKS,
            untilResolved: {
              template: ''
            },
            dependencies: ['id']
          })
          .segment('languages', {
            templateUrl: '../templates/languages.tmpl.html',
            controller: LanguagesController,
            resolve: RouteResolver.LANGUAGES,
            untilResolved: {
              template: ''
            }
          })
          .segment('qr', {
            templateUrl: '../templates/reader.tmpl.html',
            controller: QRController,
            dependencies: ['id']
          })
          .segment('languagebooks', {
            templateUrl: '../templates/dynamicbooks.tmpl.html',
            controller: LanguageBooksController,
            resolve: RouteResolver.LANGUAGEBOOKS,
            untilResolved: {
              template: ''
            },
            dependencies: ['id']
          })
          .segment('bookinfo', {
            templateUrl: '../templates/bookinfo.tmpl.html',
            controller: BookDetailsController,
            dependencies: ['id']
          })
          .segment('search', {
            controller: SearchController,
            templateUrl: '../templates/search.tmpl.html'
          })
          .segment('bookread', {
            templateUrl: '../templates/reader.tmpl.html',
            controller: ReaderController,
            dependencies: ['id']
          })
          .segment('bookpreview', {
            templateUrl: '../templates/reader.tmpl.html',
            controller: PreviewController,
            dependencies: ['id']
          })
          .segment('order', {
            templateUrl: '../templates/order.tmpl.html',
            controller: OrderController,
            dependencies: ['id']
          });

  $routeProvider.otherwise({ redirectTo: '/nav/shelf' });
}

routerConfig['$inject'] = ['$routeSegmentProvider', '$routeProvider'];

function runTextCatalogBlock(getTextCatalog, settings) {
  angular.forEach(settings.translations, function(value, key) {
    getTextCatalog['currentLanguage'] = 'ln'; //Fake language key, see settings constant
    getTextCatalog['debug'] = false;
    getTextCatalog['setStrings'](key, value);
  });
}

function init($rootScope, $location, $cartService, $apiService) {
  //Moved here from AppController
  $rootScope['status'] = {'offline': false, 'trial': false, 'nocookieconfirm': false};
  $cartService.setApiService($apiService);
  var pathAfterLogin;

  $rootScope.$on('$routeChangeError', function(e, $cur, $prev, rejection) {
    pathAfterLogin = (rejection === 'login' || rejection === 'registration') ? $location.path() : '';
    var redirectPath = '/' + rejection;
    $location.path(redirectPath);
  });

  $rootScope.$on('$routeChangeSuccess', function(e, $cur, $prev) {
    var $currentRoute = $cur['$$route'],
        $prevRouteSegment = $prev && $prev['$$route'] ? $prev['$$route'].segment : '',
        $curRouteSegment = $currentRoute ? $currentRoute.segment : '';
    if (!$currentRoute) return;

    if ($curRouteSegment === 'nav.cookies') {
      $rootScope['status']['nocookieconfirm'] = false;
    } else {
      $rootScope['status']['nocookieconfirm'] = !document.cookie.match('haveRead=1');
    }

    if (!($curRouteSegment == 'login' || $curRouteSegment == 'registration' || $curRouteSegment == 'forgot') &&
        ($prevRouteSegment == 'login' || $prevRouteSegment == 'registration') && !!pathAfterLogin) {
      $location.path(pathAfterLogin);
      pathAfterLogin = '';
    }
    var ga = window['ga'];
    if(ga) ga('send', 'pageview', $currentRoute['originalPath']);
  });
}

init['$inject'] = ['$rootScope', '$location', CartService.fullName, 'ApiService'];

function httpConfig($httpProvider, settings) {
  var JSON_START = /^\[|^\{(?!\{)/,
      JSON_ENDS = {
                    '[': /]$/,
                    '{': /}$/
      };

  function isJsonLike(str) {
    var jsonStart = str.match(JSON_START);
    return jsonStart && JSON_ENDS[jsonStart[0]].test(str);
  }

  function responseTransform(data, headers) {
    if (angular.isString(data)) {
      // Strip json vulnerability protection prefix and trim whitespace
      var tempData = data.replace(/^\)\]\}',?\n/, '').trim();

      if (tempData) {
        var contentType = headers('Content-Type');
        if ((contentType && (contentType.indexOf('application/json') === 0)) && isJsonLike(tempData)) {
          try {
            data = JSON.parse(tempData);
          } catch (e) {
            console.info(e);
          }
        }

      }
    }
    return data;
  }

  $httpProvider.defaults.withCredentials = true;
  $httpProvider.defaults.transformResponse = responseTransform;

}

httpConfig['$inject'] = ['$httpProvider'];

var app = angular.module('app', ['ng',
                                  'ngRoute',
                                  'ngTouch',
                                  'LocalForageModule',
                                  API.name,
                                  UISCROLL.name,
                                  'route-segment',
                                  'view-segment',
                                  'gettext',
                                  'ngDialog',
                                  'ui.scroll.jqlite']);

var settings = window['gSettings'];

app.constant('version', {'value': '0.99'})
    .constant('settings', {
        idSite: settings['idSite'],
        idShop: settings['viewingIdShop'],
        backendURL: settings['backendURL'],
        imageHost: settings['imageHost'],
        isDeveloper: settings['DEVELOPER'],
        thumbDimension: settings['THUMB'],
        interval: parseInt(settings['interval'], 10),
        isRTL: (settings['currentLocale'] == 'ar_AE'),
        translations: {
              'ln': settings['translations']
        }
      })
    .factory(BookFactory.fullName, BookFactory)
    .service(AuthService.fullName, AuthService)
    .service(SessionService.fullName, SessionService)
    .service(CartService.fullName, CartService)
    .directive(CompareD.fullName, CompareD)
    .directive(FontSizeD.fullName, FontSizeD)
    .directive(EpubReaderD.fullName, EpubReaderD)
    .directive(SliderD.fullName, SliderD)
    .controller(ApplicationController.fullName, ApplicationController)
    .run(init)
    .run(['gettextCatalog', 'settings', runTextCatalogBlock])
    .config(routerConfig)
    .config(httpConfig)
    .config(['$qProvider', function ($qProvider) {
      $qProvider.errorOnUnhandledRejections(false);
    }])
    .config(['$localForageProvider', function($localForageProvider) {
        $localForageProvider.config({
          driver: (settings['isIOS']) ? ['webSQLStorage', 'localStorageWrapper'] : ['webSQLStorage', 'asyncStorage', 'localStorageWrapper'],
          'name': 'mooqla', // name of the database and prefix for your data, it is "lf" by default
          //version: 1.0, // version of the database, you shouldn't have to use this
          'storeName': 'mstore' // name of the table
          //description: 'some description'
        });
      }]);

export default app;

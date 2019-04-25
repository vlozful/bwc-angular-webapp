import BaseController from "../core/BaseController";
import BookFactory from "../factories/BookFactory";
import ApiService from "../modules/api/ApiService";
import SessionService from "../services/SessionService";

var $bookFactory,
    $apiService,
    $sessionService,
    $routeSegment,
    $scope;


function sendToGA(str, action, book) {
  var ga = window['ga'];
  if(ga) ga('send', 'event', str, action, book['title'], book['currentPage']);
}

export default BaseController.extend('ReaderController', {

  bookId: '',

  bookData: '',

  loadStatus: '',

  ssid: '',

  constructor: function(_$scope, _$route, _$bookFactory, _$apiService, _$sessionService, _$routeSegment) {
    var self = this;
    $bookFactory = _$bookFactory;
    $apiService = _$apiService;
    $sessionService = _$sessionService;
    $routeSegment = _$routeSegment;
    $scope = _$scope;
    self.bookData = {'book': {}};
    self.bookId = _$route.current.params['id'];
    self.ssid = _$route.current.params['ssid'];
    self._super([_$scope]);

    if (self.ssid)
      self.openWithSSID();
    else
      self.openStoredBook();
  },

  openWithSSID: function() {
    var self = this;
    $sessionService.update(self.ssid)
      .then(
        function() {
          self.openServerBook();
        },
        function(error) {
          console.log(error);
          $scope['navigate']['login']();
        });
  },

  openServerBook: function() {
    var self = this;

    function onServerError() {
      $scope['navigate']['home']();
    }

    $apiService.getBookDetails(self.bookId)
      .then(function(book) {
          $apiService.getFullEpubLink(self.bookId)
            .then(function(path) {
                $apiService.getEpub(path, self.$scope['ondownload'])
                  .then(function(blob) {
                      book['epubBlob'] = blob;
                      book['opened'] = Date.now();
                      self.bookData['book'] = book;
                      sendToGA('BookFromLink', 'open', book);
                    }, onServerError);
              }, onServerError);
        }, onServerError);
  },

  openStoredBook: function() {
    var self = this;
    $bookFactory.bookFromStored(self.bookId)
        .then(function(book) {
              book['opened'] = Date.now();
              self.bookData['book'] = book;
              sendToGA('Book', 'open', book);
          }, function(error) {
              alert('Error retrieving book\n' + error);
              $scope['navigate']['home']();
          });
  },

  defineScope: function(_$scope) {
    _$scope['bookData'] = this.bookData;
  },

  storeBookData: function(_book) {
    if (_book['id'] == undefined) return;
    $apiService.updateBookData(_book['id'], _book['currentPage'], _book['fontSize']);
    return $bookFactory.storeBookData(_book)
        .then(function(book) {
            console.log('book stored:', book);
        }, function(error) {
            console.log('error storing book', error);
        });
  },

  defineListeners: function(_$scope) {
    var self = this;

    _$scope.$on('fontSize: closed', function(e, value) {
      var _book = self.bookData['book'];
      _book['fontSize'] = value;
      self.storeBookData(_book)
          .then(function() {
              $routeSegment.chain[1].reload();
          });
    });

    _$scope.$on('$destroy', function() {
      var _book = self.bookData['book'];
      sendToGA('Book', 'close', _book);
      _book['stored'] = false;
      self.storeBookData(_book);
    });
  }
}).inject('$route', BookFactory.fullName, ApiService.fullName, SessionService.fullName, '$routeSegment');

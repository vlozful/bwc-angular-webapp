import BaseController from "../core/BaseController";
import BookFactory from "../factories/BookFactory";
import ApiService from "../modules/api/ApiService";

var $bookFactory,
    $apiService,
    $routeSegment,
    $scope;

function onServerError() {
  $scope['navigate']['home']();
}

export default BaseController.extend('QRController', {

  bookId: '',

  qrId: '',

  bookData: '',

  loadStatus: '',

  constructor: function(_$scope, _$route, _$bookFactory, _$apiService, _$routeSegment) {
    var self = this;
    $bookFactory = _$bookFactory;
    $apiService = _$apiService;
    $routeSegment = _$routeSegment;
    $scope = _$scope;
    self.bookData = {'book': {}};
    self.qrId = _$route.current.params['id'];
    self._super([_$scope]);

    $apiService.getQRBookInfo(self.qrId)
      .then(function(result) {
          self.bookId = result['idBook'];
          $apiService.getBookDetails(self.bookId)
            .then(function(book) {
                $apiService.getFullEpubLink(self.bookId)
                  .then(function(path) {
                      $apiService.getEpub(path, self.$scope['ondownload'])
                        .then(function(blob) {
                            book['epubBlob'] = blob;
                            book['opened'] = Date.now();
                            self.bookData['book'] = book;
                            window['ga']('send', 'event', 'QRBook', 'open', book['title'], book['currentPage']);
                          }, onServerError);
                    }, onServerError);
              }, onServerError);
        }, onServerError);
  },

  defineScope: function(_$scope) {
    _$scope['bookData'] = this.bookData;
  },

  storeBookData: function(_book) {
    if (_book['id'] == undefined) return;
    $apiService.updateBookData(_book['id'], _book['currentPage'], _book['fontSize']);
  },

  defineListeners: function(_$scope) {
    var self = this;

    _$scope.$on('fontSize: closed', function(e, value) {
      var _book = self.bookData['book'];
      _book['fontSize'] = value;
      self.storeBookData(_book).then(function() {
        $routeSegment.chain[1].reload();
      });
    });

    _$scope.$on('$destroy', function() {
      var _book = self.bookData['book'];
      window['ga']('send', 'event', 'Book', 'close', _book['title'], _book['currentPage']);
      _book['stored'] = false;
      self.storeBookData(_book);
    });
  }
}).inject('$route', BookFactory.fullName, ApiService.fullName, '$routeSegment');

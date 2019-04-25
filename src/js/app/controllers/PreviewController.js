import BaseController from "../core/BaseController";
import ApiService from "../modules/api/ApiService";

var $apiService,
    $routeSegment;

export default BaseController.extend('PreviewController', {

  bookId: '',

  bookData: '',

  loadStatus: '',

  constructor: function(_$scope, _$route, _$apiService, _$routeSegment) {
    var self = this;
    $apiService = _$apiService;
    self.bookData = {'book': {}};
    self.bookId = _$route.current.params['id'];
    self._super([_$scope]);
    $routeSegment = _$routeSegment;

    $apiService.getBookDetails(self.bookId)
      .then(function(book) {
          self.bookData['book'] = book;
      })
          .then(function() {
              $apiService.getPreviewEpubLink(self.bookId)
                .then(function(link) {
                      $apiService.getEpub(link, _$scope['ondownload']).then(
                          function(epub) {
                            self.bookData['book']['epubBlob'] = epub;
                          }, function(error) {
                                console.log(error, 'Error retrieving preview');
                          }
                      );
                  }, function(error) {
                        console.log(error, 'Error getting preview link');
                  });
            });
  },

  defineScope: function(_$scope) {
    _$scope['bookData'] = this.bookData;
  },

  defineListeners: function(_$scope) {
    var self = this;

    _$scope.$on('fontSize: closed', function(e, value) {
      var _book = _$scope['bookData']['book'];
      _book['fontSize'] = value;
      $apiService.updateBookData(self.bookId, _book['currentPage'], _book['fontSize'])
          .then(function() {
              $routeSegment.chain[1].reload();
          });
    });
  }

}).inject('$route', ApiService.fullName, '$routeSegment');

import angular from "angular";
import ListController from "../core/ListController";
import BookFactory from "../factories/BookFactory";
import SessionService from "../services/SessionService";


var SHELFCAPACITY = 3,
          $localForage,
          $apiService,
          $bookFactory,
          $sessionService,
          $route,
          $q;

export default ListController.extend('MyBooksController', {

  path: 'book',

  fetchAll: true,

  bookShelf: '',

  bookList: '',

  constructor: function(_$scope, _$route, _$apiService, _$localForage, _$bookFactory, _$sessionService, _$q) {
    $localForage = _$localForage;
    $apiService = _$apiService;
    $bookFactory = _$bookFactory;
    $sessionService = _$sessionService;
    $route = _$route;
    $q = _$q;
    this.bookShelf = [];
    this.bookList = new Array(SHELFCAPACITY);
    var self = this, i = 0;

    for (; i < SHELFCAPACITY; i++) {
      this.bookShelf.push({});
    }

    $localForage.getItem('bookshelf')
      .then(function(data) {
          if (!data) {
            $localForage.setItem('bookshelf', self.bookList);
          } else {
            $bookFactory.booksFromStoredArray(data)
              .then(function(books) {
                  books.forEach(function(book, index) {
                    self.bookShelf[index] = book;
                  });
                  self.clearTrialBooks();
                  self.arrangeBooks();
                }, function(err) {
                    console.log(err);
                }
            );
          }
      }, function(error) {
          console.log('error', error)
        }
    );
    this._super(arguments);
    this.api = this.getFromApi;
  },

  arrangeBooks: function() {
    function compare(a, b) {
      var isA = a && a['opened'],
          isB = b && b['opened'];

      if (isA && isB) {
        return b['opened'] - a['opened'];
      } else {
        if (!isB && !isA) return 0;
        if (isB && !isA) return 1;
        if (isA && !isB) return -1;
      }
    }

    this.bookShelf.sort(compare);
    this.bookList = this.bookShelf.map(function(book) {
      return (book && book['id']) ? book['id'] : null;
    });
  },

  getFromApi: function() {
    return $apiService.getUserBooks();
  },

  clearTrialBooks: function() {
    var d = [],
        self = this,
        result = $q.defer();
    this.bookShelf.forEach(function(book, index) {
      if (book && book['id'] && !book['available']()) {
        d.push($bookFactory.removeFromStore(book).then(function() {
          self.bookShelf[index] = {};
        }));
      }
    });

    $q.all(d).then(
        function() {
          self.arrangeBooks();
          $localForage.setItem('bookshelf', self.bookList).then(
              function() {
                result.resolve();
              },
              function(err) {
                console.log(err);
                result.reject();
              }
          );
        });

    return result.promise;
  },

  parseResponse: function(data) {
    data.forEach(function(item, index) {
      data[index] = $bookFactory.bookFromData(item);
    });
    return data;
  },

  defineScope: function(_$scope) {
    var self = this;
    this._super([_$scope]);

    _$scope['addToShelf'] = this.addToShelf.bind(this);
    _$scope['bookShelf'] = this.bookShelf;
    _$scope['removeFromMyBooks'] = function(book, $event) {
      var booksAdapter = this['booksAdapter'];
      $event.preventDefault();
      $event.cancelBubble = true;
      $apiService.deleteTrialBook(book.id).then(
          function() {
            self.getFromApi().then(
                function(data) {
                  self.buffer = data;
                  booksAdapter.reload();
                });
          });
    };
    _$scope['read'] = function(book) {
      _$scope['navigate']['readBook'](book);
    };
  },

  defineListeners: function(_$scope) {
    var self = this;
    _$scope.$on('$destroy', function() {
      self.bookShelf.forEach(function(book) {
        $bookFactory.revokeThumb(book);
      });
    });
  },

  addToShelf: function(book, $scope) {
    var self = this,
        place = -1,
        min = Date.now(),
        i = 0,
        book_id = book['id'];

    //if we have this book already
    for (i = 0; i < SHELFCAPACITY; i++) {
      if (book['id'] == self.bookList[i]) return;
    }

    //seek free space
    for (i = 0; i < SHELFCAPACITY; i++) {
      if (!self.bookList[i]) {
        place = i;
        break;
      }
    }

    //seek first opened
    if (place < 0) {
      self.bookShelf.forEach(function(book, index) {
        var opened = book['opened'];
        if (angular.isDefined(opened) && opened < min) {
          min = opened;
          place = index;
        }
      });
    }

    $apiService.getFullEpubLink(book_id)
      .then(function(link) {
          $apiService.getEpub(link, self.$scope['ondownload'])
            .then(function(epubArray) {
                $bookFactory.storeEpub(book_id, epubArray)
                  .then(function() {
                      book['epubBlob'] = epubArray;
                      $bookFactory.storeBook(book).then(
                          function(storedBook) {
                            var oldBook = self.bookShelf[place];
                            if (oldBook && oldBook['stored']) {
                              $bookFactory.removeFromStore(oldBook);
                            }
                            self.bookShelf[place] = storedBook;
                            self.arrangeBooks();
                            //arrangeShelves(self.bookShelf, self.bookList);
                            $localForage.setItem('bookshelf', self.bookList);
                          },
                          function(error) {
                            console.log('Error storing book', error);
                            $bookFactory.removeFromStore(book);
                          }
                      );
                  })
              });
        }, function(error) {
            if ($sessionService.trial && parseInt(error['errorCode'], 10) == 170) {
              $sessionService.load().then(
                  function() {
                    $scope['booksAdapter'].reload();
                    self.clearTrialBooks();
                  });
            }
      });
    }
}).inject('$localForage', BookFactory.fullName, SessionService.fullName, '$q');

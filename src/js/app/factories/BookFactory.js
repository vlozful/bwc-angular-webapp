import angular from "angular";
import BookModel from "../models/Book";
import ApiService from "../modules/api/ApiService";

function generateBookKey(book_id) {
  if (angular.isDefined(book_id) && book_id >= 0) return 'book_' + book_id;
}

function generateThumbKey(book_id) {
  return generateBookKey(book_id) + '_thumb';
}

function generateEpubKey(book_id) {
  return generateBookKey(book_id) + '_epub';
}

var urlCreator = window['URL'] || window['webkitURL'],
    $apiService,
    $storageService,
    $q,

    factory = function(_$apiService,  _$storageService, _$q) {
      $apiService = _$apiService;
      $storageService = _$storageService;
      $q = _$q;
      return {

        bookFromData: function(data) {
          return new BookModel(data);
        },

        bookFromStored: function(book_id) {
          var deferred = $q.defer(), result = {};
          if (book_id !== null && angular.isDefined(book_id) && book_id >= 0) {
            $storageService.getItem(generateBookKey(book_id))
              .then(
                function(book) {
                  result = new BookModel(book);
                  return book;
                },
                function(error) {
                  deferred.reject(error);
                })
              .then(
                function() {
                  $storageService.getItem(generateThumbKey(book_id))
                    .then(
                      function(blob) {
                        if (!blob) {
                          deferred.reject({error: 'No thumb blob for book ' + book_id});
                          return blob;
                        }
                        result['thumbBlob'] = blob;
                        result['thumb'] = urlCreator['createObjectURL'](blob);
                        $storageService.getItem(generateEpubKey(book_id)).then(
                          function(epub) {
                            result['epubBlob'] = epub;
                            deferred.resolve(result);
                          },
                          function(error) {
                            deferred.reject(error);
                            console.log('error: ', error);
                          }
                        );
                      },
                      function(error) {
                        deferred.reject(error);
                      });
                });
          } else deferred.reject('Book id is not defined');
          return deferred.promise;
        },

        booksFromStoredArray: function(bookList) {
          var i = 0, promises = [];
          for (; i < bookList.length; i++) {
            if (bookList[i]) promises.push(this.bookFromStored(bookList[i])); else break;
          }
          return $q.all(promises);
        },

        storeEpub: function(book_id, blob) {
          var epub_id = generateEpubKey(book_id);
          return $storageService.setItem(epub_id, blob);
        },

        removeEpub: function(book_id) {
          return $storageService.removeItem(generateEpubKey(book_id));
        },

        removeThumb: function(book_id) {
          return $storageService.removeItem(generateThumbKey(book_id));
        },

        storeBookData: function(bookData) {
          var storedBook = new BookModel(bookData),
              deferred = $q.defer();
          if (bookData['stored']) {
            deferred.resolve(storedBook);
          } else {
            storedBook['stored'] = Date.now();
            if (!storedBook['opened']) storedBook['opened'] = Date.now();
            $storageService.setItem(generateBookKey(storedBook['id']), storedBook)
              .then(
                function(ok) {
                  deferred.resolve(storedBook);
                },
                function(error) {
                  deferred.reject(error);
                });
          }

          return deferred.promise;
        },

        storeBook: function(book) {
          var deferred = $q.defer(),
              self = this;

          if (book['stored']) {
            deferred.resolve(book);
            return deferred.promise;
          }

          $apiService.getFile(book['thumb'])
            .then(
              function(thumbBlob) {
                return thumbBlob;
              },
              function(httpError) {
                deferred.reject(httpError);
              })
            .then(function(thumbBlob) {
                if (!thumbBlob) return false;
                var blob_id = generateThumbKey(book['id']);
                $storageService.setItem(blob_id, thumbBlob)
                    .then(function() { //ok saving thumbBlob
                        self.storeBookData(book)
                            .then(function(storedBook) {
                                storedBook['thumbBlob'] = thumbBlob;
                                storedBook['thumb'] = urlCreator['createObjectURL'](thumbBlob);
                                deferred.resolve(storedBook);
                            }, function(error) {
                                $storageService.removeItem(blob_id);
                                deferred.reject(error);
                            }
                        );
                      }, function(saveBlobError) {
                            deferred.reject(saveBlobError);
                      });
              });

          return deferred.promise;
        },

        removeFromStore: function(book) {
          var self = this,
              deferred = $q.defer(),
              book_id = book['id'];

          function errorHandler(error) {
            deferred.reject(error);
          }

          if (!book['stored']) {
            deferred.resolve();
            return;
          }

          self.removeEpub(book_id).then(function() {
            self.removeThumb(book_id).then(function() {
              $storageService.removeItem(generateBookKey(book_id)).then(function() {
                self.revokeThumb(book);
                console.log(book, 'removed');
                deferred.resolve(book_id);
              }, errorHandler)}, errorHandler)}, errorHandler);

          return deferred.promise;
        },

        revokeThumb: function(book) {
          urlCreator['revokeObjectURL'](book['thumb']);
        }
      }};

factory.fullName = 'BookFactory';
factory['$inject'] = [ApiService.fullName, '$localForage', '$q'];

export default factory;


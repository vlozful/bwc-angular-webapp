import angular from "angular";
import AC from "../../core/AngularClass";
import GenreModel from "../../models/Genre";
import BookModel from "../../models/Book";
import LanguageModel from "../../models/Language";
import HttpService from "./HttpService";
import CartItemModel from "../../models/CartItem";
import CartService from "../../services/CartService";

var $httpService, $cartService, siteId, shopId, interval, ssid,
    IDPROJECT = 'webApp';

function createLoginRequestData(email, password) {
  return {
    'email': email,
    'password': password
  }}

function createRegisterRequestData(email, password, passwordConfirm, country, idLang) {
  var result = {
    'login': email,
    'idProject': IDPROJECT,
    'password': password,
    'idLanguage': idLang,
    'idCountry': country
  };

  angular.forEach(result, function(value, key) {
    if (!value) delete result[key];
  });

  return result;
}

function createBookListRequestData(offset, count, genre_id, lang_id, filter) {
  var result = {
    'offset': offset,
    'count': count,
    'ssid': ssid,
    'idGenresList': genre_id,
    'idLanguagesList': lang_id,
    'approved': 1,
    'filter': filter
  };

  angular.forEach(result, function(value, key) {
    if (!value) delete result[key];
  });

  return result;
}

function createBookDetailsRequest(book_id) {
  return {
    'idBook': book_id,
    'ssid': ssid
  }}

function parseBooksResponse(data) {
  var result = [], book;
  data.forEach(function(value) {
    book = new BookModel(value);
    $cartService.check(book);
    result.push(book);
  });
  return result;
}

export default AC.extend('ApiService', {

  constructor: function(_$httpService, _$cartService, _settings) {
    $httpService = _$httpService;
    $cartService = _$cartService;

    if (_settings.isDeveloper) {
      window['$httpService'] = $httpService;
      window['$apiService'] = this;
    }

    siteId = _settings.idSite;
    shopId = _settings.idShop;
    interval = _settings.interval;
  },

  setSSID: function(_ssid) {
    ssid = _ssid;
  },

  changeSession: function(_ssid) {
    var request = {};
    if (_ssid) request['ssid'] = _ssid;
    return $httpService.requestWithToken('sessionsReplace', request).then(function(result) {
      ssid = result.ssid;
      return result;
    });
  },

  getSession: function() {
    return $httpService.request('sessionsSelect');
  },

  getCountries: function() {
    return $httpService.request('countriesSelect', {'idProject': IDPROJECT});
  },

  login: function(email, password) {
    return $httpService.submit('g-themes-webapp-forms-login', createLoginRequestData(email, password));
  },

  logout: function() {
    return $httpService.request('authLogout');
  },

  register: function(email, password, passwordConfirm, country, idLang) {
    return $httpService.requestWithToken('usersRegister', createRegisterRequestData(email, password, passwordConfirm, country, idLang));
  },

  getHashCode: function(email) {
    return $httpService.requestWithToken('usersRestorePasswordRequest', {'login': email});
  },

  getQRBookInfo: function(hashcode) {
    return $httpService.requestWithToken('QRLinksOpen', {'ssid': ssid, 'hash': hashcode});
  },

  getCartItems: function() {
    function _parseResponse(data) {
      var result = [], bookData;
      data.forEach(function(value) {
        bookData = new CartItemModel(value);
        result.push(bookData);
      });
      return result;
    }
    return $httpService.requestWithToken('cartsItemsSelect', {'ssid': ssid, 'idShop': shopId}).then(_parseResponse);
  },

  addCartItem: function(book) {
    return $httpService.requestWithToken('cartsItemsInsert', {'viewingIdShop': shopId, 'qty': 1, 'idProductsVariations': book['variation']});
  },

  removeCartItem: function(cartItem) {
    return $httpService.requestWithToken('cartsItemsDelete', {'idCartsItems': cartItem['id']});
  },

  restorePassword: function(_hash, _password) {
    return $httpService.requestWithToken('usersRestorePassword', {'hash': _hash, 'newPassword': _password});
  },

  changePassword: function(old_pwd, new_pwd) {
    return $httpService.requestWithToken('usersChangePassword', {'oldPassword': old_pwd, 'newPassword': new_pwd});
  },

  getUserBooks: function() {
    return $httpService.request('booksSelect', {'ssid': ssid, 'myBook': 1}).then(parseBooksResponse);
  },

  updateBookData: function(id, page, font) {
    return $httpService.requestWithToken('bwcMyBooksUpdate', {'idBook': id, 'bwcCurrentPage': page, 'bwcFontSize': font});
  },

  addTrialBook: function(id) {
    return $httpService.requestWithToken('bwcMyBooksInsert', {'idBook': id});
  },

  deleteTrialBook: function(id) {
    return $httpService.requestWithToken('bwcMyBooksDelete', {'idBook': id});
  },

  getNewBooks: function(start, end, lang_id) {
    var request = createBookListRequestData(start, (end - start), null/*, lang_id */),
        a = (interval) ? interval : 0,
        dat = new Date(+new Date() - a); //1209600000

    request['updatedAfter'] = dat.toISOString().split('T')[0];
    return $httpService.request('booksSelect', request).then(parseBooksResponse);
  },

  getTopBooks: function(start, end, lang_id) {
    var request = createBookListRequestData(start, (end - start), null/*, lang_id*/);
    request['orderBy'] = 'popular';
    return $httpService.request('booksSelect', request).then(parseBooksResponse);
  },

  getGenresList: function(lang_id) {
    function parseResponse(data) {
      var result = [];
      data.forEach(function(value) {
        result.push(new GenreModel(value));
      });
      return result;
    }

    return $httpService.request('genresSelect', {'countBooks': 1, 'showEmpty': 'no', 'approved': 1/*, 'idLanguagesList': lang_id*/})
      .then(parseResponse);
  },

  getBooksByGenre: function(start, end, genre_id, lang_id) {
    return $httpService.request('booksSelect', createBookListRequestData(start, (end - start), genre_id/*, lang_id*/)).then(parseBooksResponse);
  },

  getBookDetails: function(book_id) {
    function _parseResponse(data) {
      var book;
      if (angular.isArray(data)) {
        book = new BookModel(data[0]);
        $cartService.check(book);
        return new BookModel(book);
      }
      return null;
    }
    return $httpService.request('booksSelect', createBookDetailsRequest(book_id)).then(_parseResponse);
  },

  getBookLanguages: function() {
    function _parseResponse(data) {
      var result = [];
      data.forEach(function(value) {
        result.push(new LanguageModel(value));
      });
      return result;
    }
    return $httpService.request('languagesSelect', {'countBooks': 1, 'showEmpty': 'no', 'approved': 1})
      .then(_parseResponse);
  },

  getBooksByLanguage: function(start, end, language_id) {
    return $httpService.request('booksSelect', createBookListRequestData(start, (end - start), null, language_id)).then(parseBooksResponse);
  },

  getSearchResults: function(searchString) {
    return $httpService.request('booksSelect', createBookListRequestData(null, null, null, null, searchString)).then(parseBooksResponse);
  },

  getFile: function(path, progressCallback, type) {
    return $httpService.requestFile(path, progressCallback, type);
  },

  getPreviewEpubLink: function(book_id) {
    return $httpService.requestWithToken('booksPreview', {'mobi': 0, 'idBook': book_id});
  },

  getFullEpubLink: function(book_id) {
    return $httpService.requestWithToken('booksDownload', {'mobi': 0, 'idBook': book_id, 'bwc': 1});
  },

  getEpub: function(path, progressCallback) {
    return $httpService.requestFile(path, progressCallback, 'arraybuffer');
  },

  getBrainTreeClientToken: function() {
    return $httpService.requestWithToken('brainTreeGenerateClientToken', {'idShop': shopId});
  },

  buy: function(book_id, bt_token) {
    return $httpService.requestWithToken('booksBuy', {'idBook': book_id, 'idSite': siteId, 'braintreeToken': bt_token});
  },

  getOrderStatus: function(order_id) {
    return $httpService.request('ordersSelect', {'idOrder': order_id, 'ssid': ssid, 'idSite': siteId});
  },

  sessionsIdLanguage: function(lang_id) {
    var request = lang_id ? {'idLanguage': lang_id} : {};
    return $httpService.request('sessionsIdLanguage', request);
  }

}).inject(HttpService.fullName, CartService.fullName, 'settings');

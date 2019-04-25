import Class from "../../lib/Class";
import GenreModel from "../models/Genre";

var settings = window['gSettings'],
    imageHost = settings['imageHost'],
    thumbSettings = settings['THUMB'],
    MAXDATETIMETO = parseDate('9999-01-01 00:00:00');

function parseDate(date) {
  var arr = date.split(/[- :]/),
      date = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]).getTime();

  return date;
}

function getThumbPath(thumbId) {
  if (angular.isObject(thumbId)) {
    thumbId = thumbId['URL'].match(/\d+(?=.jpg)/);
  }
  thumbId = thumbId ? thumbId : 2;
  return thumbId ? imageHost + '/userfiles/img/id' + thumbId + 'w' + thumbSettings['width'] + 'h' + thumbSettings['height'] + '.jpg' : null;
}

function parseAuthors(authors) {
  if (!angular.isArray(authors)) return '';
  var result = [];
  authors.forEach(function(author) {
    var lastName = author['lastName'],
        firstName = author['firstName'],
        nickname = author['nickname']

    result.push((!lastName && !firstName) ? nickname : lastName + ' ' + firstName);
  });
  return result.join(', ');
}

function parseGenres(genres) {
  var result = [];
  if (!angular.isArray(genres)) return result;
  genres.forEach(function(genre) {
    result.push(new GenreModel(genre));
  });
  return result;
}

function parseACR(bookAccessArray) {
  if (!angular.isArray(bookAccessArray)) return [];
  bookAccessArray.forEach(function(item) {
    item['dateTimeFrom'] = !item['dateTimeFrom'] ? 0 : parseDate(item['dateTimeFrom']);
    item['dateTimeTo'] = !item['dateTimeTo'] ? MAXDATETIMETO : parseDate(item['dateTimeTo']);
  });

  return bookAccessArray.filter(function(item, index, array) {
    var result = true,
        n = array.length - 1;
    for (var i = index + 1; i <= n; i++) {
      var testItem = array[i];
      if (item['dateTimeFrom'] == testItem['dateTimeFrom'] && item['dateTimeTo'] == testItem['dateTimeTo']) {
        result = false;
        break;
      }
    }

    return result;
  });
}

function parseAndRound(str) {
  if (!str) return false;
  return Math.round(parseFloat(str) * 100) / 100;
}

export default Class.create('Book', {
  'id': '',
  'variation': '',
  'lang_id': '',
  'thumbBlob': '',
  'thumb': '',
  'epubBlob': '',
  'title': '',
  'author': '',
  'price': '',
  'status': '',
  'stored': '',
  'opened': '',
  'summary': '',
  'bookAuthors': '',
  'bookGenres': '',
  'VAT': '',
  'ACR': '',
  'isMyBook': '',
  //'isBought': '',
  'currency': '',
  'genres': '',
  'bookmark': '',
  'totalPages': '',
  'currentPage': '',
  'fontSize': 2,
  'inCart': false,
  'dir': '',

  'available': function() {
    var dt = Date.now();
    return this['ACR'].some(function(acr) {
      return acr['dateTimeFrom'] <= dt && acr['dateTimeTo'] > dt;
    });
  },

  'isTrial': function() {
    var dt = Date.now();
    return !this['ACR'].some(function(acr) {
      return acr['dateTimeTo'] == MAXDATETIMETO && acr['dateTimeFrom'] <= dt;
    });
  },

  constructor: function(data) {
    if (angular.isObject(data)) {
      this['id'] = data['id'] || data['idBook'];
      this['variation'] = data['variation'] || data['idProductsVariations'];
      this['title'] = data['title'];
      this['bookAuthors'] = data['bookAuthors'];
      this['bookGenres'] = data['bookGenres'];
      this['genres'] = parseGenres(data['bookGenres']);
      this['author'] = data['author'] || parseAuthors(data['bookAuthors']);
      this['price'] = parseAndRound(data['priceConverted']) || data['price'];
      this['VAT'] = parseAndRound(data['VATConverted']) || data['VAT'];
      this['ACR'] = data['ACR'] || parseACR(data['booksAccess']);
      this['currency'] = data['currency'] || data['currencyDesignationConverted'];
      this['thumb'] = data['thumb'] || getThumbPath(data['images'][0]);
      this['summary'] = data['summary'] || data['annotation'];
      this['status'] = data['status'];
      this['stored'] = data['stored'];
      this['lang_id'] = data['lang_id'] || data['idLanguage'];
      this['opened'] = data['opened'];
      this['bookmark'] = data['bookmark'];
      this['totalPages'] = data['totalPages'];
      this['currentPage'] = data['bwcCurrentPage'] || data['currentPage'];
      this['isMyBook'] = data['isMyBook'] === true || data['isMyBook'] === '1';
      //this['isBought'] = data['isBought'] === true || data['isBought'] === '1';
      this['inCart'] = !!data['inCart'];
      this['fontSize'] = (data['bwcFontSize'] && data['bwcFontSize'] !== '0') ? parseInt(data['bwcFontSize'], 10) : data['fontSize'] || this['fontSize'];
      if (data['dir']) this['dir'] = data['dir']; else this['dir'] = (parseInt(data['rtl']) === 1) ? 'rtl' : 'ltr';
    }
  }
});

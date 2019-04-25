import ListController from "../core/ListController";
import SessionService from "../services/SessionService";

export default ListController.extend('GenreBooksController', {

  fetchAll: false,

  path: '/nav/book',

  lang: '',

  constructor: function() {
    var sessionService = arguments[arguments.length - 1];
    this.addToScope = {
      'title' : arguments[arguments.length - 2]
    };
    this._super(arguments);
    this.lang = sessionService.languageID;
    this.api = this.apiService.getBooksByGenre;
  },

  fetch: function(index, count) {
    var api = this.api;
    if (!api) throw ('No api specified');
    var promise = api(index, count, this.param, this.lang);
    promise.then(this.parseResponse.bind(this));
    return promise;
  }

}).inject('title', SessionService.fullName);
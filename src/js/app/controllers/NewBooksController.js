import ListController from "../core/ListController";
import SessionService from "../services/SessionService";

export default ListController.extend('NewBooksController', {

  path: '/nav/book',

  fetchAll: false,

  constructor: function() {
    var sessionService = arguments[arguments.length - 1];
    this._super(arguments);
    this.api = this.apiService.getNewBooks;
    this.param = sessionService.languageID;
  }

}).inject(SessionService.fullName);

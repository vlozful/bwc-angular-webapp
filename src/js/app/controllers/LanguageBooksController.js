import ListController from "../core/ListController";

export default ListController.extend({

  fetchAll: false,

  path: '/nav/book',

  constructor: function() {
    this.addToScope = {
      'title' : arguments[arguments.length - 1]
    };
    this._super(arguments);
    this.api = this.apiService.getBooksByLanguage;
  }
}).inject('title');

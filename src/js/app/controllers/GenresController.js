import ListController from "../core/ListController";

export default ListController.extend('GenresController', {
    constructor: function() {
        this.buffer = arguments[arguments.length - 1];
        this._super(arguments);
        this.api = this.apiService.getGenresList;
    }
}).inject('data');
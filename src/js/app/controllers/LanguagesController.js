import ListController from "../core/ListController";

export default ListController.extend({
    constructor: function() {
        this.buffer = arguments[arguments.length - 1]; //data
        this._super(arguments);
        this.api = this.apiService.getBookLanguages;
    }
});

import ListController from "../core/ListController";

var $location,
    $q;

export default ListController.extend('SearchController', {

  searchString: '',

  //similarSearches: '',

  constructor: function(_$scope, _$route, _$apiService, _$q, _$location) {
    $q = _$q;
    $location = _$location;
    this.searchString = $location.search()['str'];
    this.similarSearches = [];
    this._super(arguments);
    this.api = _$apiService.getSearchResults;
    this.search(this.searchString);
  },

  init: function() {
    this.addToScope = {
      'searchString': this.searchString,
      'search': this.search.bind(this)//,
    //'similar': this.similarSearches
    }},

  search: function(str) {
    str = str ? str.trim() : '';
    if (!str.length) return;
    var self = this;
    self.$scope['searchString'] = str;
    $location.search({'str': str});
    this.apiService.getSearchResults(str).then(
        function(result) {
          //self.searchResult = result;
          self.buffer = result;
//        self.similarSearches = self.$scope['similar'] = result['similar'];
          self.$scope['provider'].adapter.reload();
        },
        function(error) {
          console.log(error);
        });
  },

  //stub
  fetch: function() {
    var result = $q.defer();
    result.reject();
    return result.promise;
  }

}).inject('$q', '$location');

import AC from "./AngularClass";
export default AC.extend({

    $scope: '',

    constructor: function(_$scope) {
      this.$scope = _$scope;
      this.init();
      this.defineListeners(_$scope);
      this.defineScope(_$scope);
    },

    init: function() {
      //OVERRIDE
    },

    defineListeners: function() {
      //OVERRIDE
    },

    defineScope: function() {
      //OVERRIDE
    }
  }).inject('$scope');

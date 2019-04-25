import angular from 'angular';

function Controller(_$scope, _$element) {
  this.$scope = _$scope;
  this.$element = _$element;
}

var increment = 1;
var proto = {

  currentSize: '',

  init: function() {
    var a = {
      'showPopup': this.showPopup.bind(this),
      'closePopup': this.closePopup.bind(this),
      'setSmaller': this.setSmaller.bind(this),
      'setGreater': this.setGreater.bind(this),
      'popup': {'active': false}
    };

    angular.extend(this.$scope, a);
  },

  showPopup: function(e) {
    var $scope = this.$scope;
    $scope['popup']['active'] = true;
    if (!this.currentSize) this.currentSize = $scope['bookData']['book']['fontSize'];
  },

  closePopup: function() {
    this.$scope['popup']['active'] = false;
    this.$scope.$emit('fontSize: closed', this.currentSize);
  },

  setSmaller: function() {
    this.currentSize -= increment;
    this.emitChanged();
  },

  setGreater: function() {
    this.currentSize += increment;
    this.emitChanged();
  },

  emitChanged: function() {
    this.$scope.$emit('fontSize: changed', this.currentSize);
  }
};

angular.extend(Controller.prototype, proto);

function directive() {
  return {
    templateUrl: '../../../templates/fontSize.tmpl.html',
    scope: false,
    link: function() {
      var a = arguments,
          $scope = a[0],
          $element = a[1],
          $attrs = a[2],
          controller = a[3],
          el = $element[0];

      controller.init();
    },
    controller: ['$scope', '$element', Controller]
  };
}
directive.fullName = 'fontSize';
export default directive;
import angular from 'angular';

function Controller(_$scope, _$swipe, _$element) {
  this.$scope = _$scope;
  this.$swipe = _$swipe;
  this.$element = _$element;
  _$scope['setSliderPosition'] = this.setPosition.bind(this);
}

var proto = {

  width: 1,

  position: 0,

  left: 0,

  init: function() {
    var $el = this.$element;
    this.width = $el[0].offsetWidth;
    this.left = $el['offset']()['left'];
    this.bindListeners();
  },

  setPosition: function(pos) {
    pos = parseFloat(pos);
    var realPos = (!pos) ? 0 : (pos < 0) ? 0 : (pos > 1) ? 1 : pos,
        $scope = this.$scope;
    $scope['slider']['position'] = this.position = realPos;
    if (!$scope['$$phase']) $scope.$apply();
  },

  bindListeners: function() {
    var self = this,
        startSwipePosition,
        startPosition;

    function slideStart(coords) {
      startSwipePosition = coords;
      self.setPosition((startSwipePosition['x'] - self.left) / self.width);
      startPosition = self.position;
      self.$scope['slider']['moving'] = true;
    }

    function slide(coords) {
      var difference = (startSwipePosition['x'] - coords['x']) / self.width;
      self.setPosition(startPosition - difference);
    }

    function slideEnd(coords) {
      self.$scope['slider']['moving'] = false;
      slide(coords);
      self.$scope.$emit('slider: position');
    }

    this.$swipe.bind(this.$element, {
      'start': slideStart,
      'move': slide,
      'end': slideEnd,
      'cancel': slideEnd
    });
  }
};

angular.extend(Controller.prototype, proto);

function directive() {
  return {
    templateUrl: '../../../templates/slider.tmpl.html',
    scope: false,
    link: function() {
      var a = arguments,
          $scope = a[0],
          $element = a[1],
          $attrs = a[2],
          controller = a[3],
          el = $element[0],
          elWidth = el.offsetWidth,
          //clickHandler = el.querySelector('.fixer'),
          handler = el.querySelector('.handler'),
          handlerWidth = handler.offsetWidth,
          orangeLine = el.querySelector('.viewed');

      $scope.$watch('slider.position', function() {
        var pos = controller.position * elWidth - handlerWidth / 2;
        handler.style.left = pos + 'px';
        orangeLine.style.width = pos + handlerWidth / 2 + 'px';
      });

      $scope.$watch('slider.width', function(value) {
        var width = Math.floor(parseFloat(value) * elWidth);
        $element.css({'width': width + 'px'});
      });

      $scope.$watch('slider.pagination', function(value) {
        handler.style.display = orangeLine.style.display = (value === true) ? 'none' : 'block';
      });

      controller.init();

    },
    controller: ['$scope', '$swipe', '$element', Controller]
  };
}
directive.fullName = 'epubSlider';

export default directive;

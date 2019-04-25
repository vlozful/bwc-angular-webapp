import angular from "angular";
import Book from "../../epub/Book";
import BookEvent from "../../epub/BookEvent";

var SOURCEATTRIBUTE = 'epubSource',
      epub;

function Controller(_$scope, _$q, _$swipe) {
  this.$scope = _$scope;
  this.$q = _$q;
  this.$swipe = _$swipe;
  this.resetSlider();
  return this;
}

var proto = {

  blob: '',

  book: '',

  sliderData: {

  },

  createBook: function($el, blob) {
    if (this.book) this.destroyBook();
    this.resetSlider();

    var self = this,
        $scope = self.$scope,
        el = $el[0],
        width = el.offsetWidth,
        height = el.offsetHeight,
        start,
        bookData = $scope['bookData'],
        book = this.book = new Book(
            {
              container: el.querySelector('#ebook'),
              width: width,
              height: height - 100,
              minSpreadWidth: width,
              styles: {'padding': '0px 15px', 'font-size': 1 + bookData['book']['fontSize'] / 10 + 'em'},
              direction: bookData['book']['rtl'] ? 'rtl' : 'ltr',
              goto: bookData['book']['currentPage']
            }, blob, this.$q, this.$scope),
        additionalData = {
          'totalPages': '',
          'currentPage': '',
          'ready': false
        };

    function changeFont(e, value) {
      console.log(e, value);
      book.view.bodyEl.style['fontSize'] = 1 + value / 10 + 'em';
    }

    if (bookData) {
      angular.extend(bookData['book'], additionalData);
    } else {
      bookData = $scope['bookData'] = {'book': additionalData};
    }

    $scope['back'] = function(value) {
      console.log('Back pressed', value);
      book.gotoHistory();
    };

    book.on(BookEvent.PAGECHANGED, function() {
      var percent = book.currentPage / book.totalPages;
      bookData['book']['currentPage'] = book.currentPage;
      //$scope.apply() goes in slider
      $scope['setSliderPosition'](percent);
    });

    book.on(BookEvent.VIEWCREATED, function() {
      bookData['book']['ready'] = true;
      book.view.on(BookEvent.IFRAMELOADED, function() {

        $scope.$on('fontSize: changed', changeFont);


        self.$swipe.bind(angular.element(book.view.window), {
          'start': function(coords) {
            start = coords;
          },
          'end': function(coords) {
            var endX = coords['x'],
                startX = start['x'];
            if (Math.abs(endX - startX) < 10) return;
            if (endX < startX) {
              if (book.view.direction === 'rtl') book.prevPage(); else book.nextPage();
            } else {
              if (book.view.direction === 'rtl') book.nextPage(); else book.prevPage();
            }
          }
        });

        //fixing bug with no events in IOS 10
        book.view.document.addEventListener('touchstart', function(e) {}, {'passive':false});
      });
    });

    book.on(BookEvent.PAGELIST, function(event, data) {
      $scope['slider']['width'] = data.value;
    });

    book.on(BookEvent.HISTORYCHANGED, function(event, data) {
      var page = false;
      if (data.value) {
        page = data.value.page;
      }
      bookData['back'] = page;
    });

    book.generatePages().then(
        function(book) {
          $scope['slider']['pagination'] = false;
          bookData['book']['totalPages'] = book.totalPages;
          book.show();
        }
    );

    $scope.$on('slider: position', function() {
      var pos = self.$scope['slider']['position'];
      book.gotoPage(Math.floor(pos * book.totalPages));
    });

    $scope.$on('$destroy', function() {
      self.destroyBook();
    });
  },

  resetSlider: function() {
    this.sliderData = {
      'width' : 0,
      'position': 0,
      'pagination': true,
      'moving': false
    };
    this.$scope['slider'] = this.sliderData;
  },

  destroyBook: function() {
    this.book.destroy();
  }
};

angular.extend(Controller.prototype, proto);

function directive() {
  return {
    templateUrl: '../../../templates/epub.tmpl.html',
    scope: true,
    link: function() {
      var a = arguments,
          $scope = a[0],
          $element = a[1],
          $attrs = a[2],
          controller = a[3];

      $scope.$watch($attrs[SOURCEATTRIBUTE], function(value) {
        if (!value) return;
        controller.createBook($element, value);
      });
    },
    controller: ['$scope', '$q', '$swipe', Controller]
  };
}
directive.fullName = 'epubReader';
export default directive;

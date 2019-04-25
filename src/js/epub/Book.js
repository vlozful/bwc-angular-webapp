import angular from "angular";
import Model from "./Model";
import Chapter from "./Chapter";
import BookEvent from "./BookEvent";
import BookView from "./BookView";

var isDestroying = false;

function createBookView(book, _settings) {
    var settings = _settings || book.settings;
    return new BookView({
        controller: book,
        width: settings.width,
        height: settings.height,
        id: settings.id || 'iframe',
        container: settings.container,
        styles: settings.styles,
        headTags: settings.headTags,
        spread: settings.spread || 'none',
        layout: settings.layout || 'reflowable',
        direction: settings.direction || 'ltr'
    });
}

function generatePageList(book) {
    var body = document.body,
        hiddenContainer = document.createElement('div'),
        hiddenEl = document.createElement('div'),
        s = angular.extend({}, book.settings),
        hiddenView,
        spineLength = book.spine.length,
        spinePos = -1,
        totalPages = 0,
        currentPage = 0,
        $q = book.$q,
        deferred = $q.defer();

    function nextChapter(opt_deferred) {
        var chapter,
            next = spinePos + 1,
            done = opt_deferred || $q.defer();

        book.trigger(BookEvent.PAGELIST, next / spineLength);
        if(isDestroying) {
          done.reject();
        } else if (next >= spineLength) {
            done.resolve();
        } else {
            spinePos = next;
            chapter = new Chapter(book.spine[spinePos], book);
            book.chapters[spinePos] = chapter;
            hiddenView.displayChapter(chapter).then(function() {
                chapter.pages = hiddenView.calculatePages();
                totalPages += chapter.pages.pageCount;
                // Load up the next chapter
                setTimeout(function() {
                nextChapter(done);
                }, 1);
            });
        }

        return done.promise;
    }

    hiddenContainer.style.visibility = hiddenContainer.style.overflow = hiddenEl.style.visibility = hiddenEl.style.overflow = 'hidden';
    hiddenContainer.style.width = hiddenContainer.style.height = '0';
    hiddenEl.style.width = book.settings.width + 'px';
    hiddenEl.style.height = book.settings.height + 'px';
    hiddenContainer.appendChild(hiddenEl);
    body.appendChild(hiddenContainer);
    s.container = hiddenEl;
    hiddenView = createBookView(book, s);

    nextChapter()
        .then(function() {
          book.totalPages = totalPages;
          deferred.resolve();
        }, function() {
          deferred.reject();
        })
        .finally(function() {
          hiddenView.destroy();
          body.removeChild(hiddenContainer);
        });
    return deferred.promise;
}

export default Model.extend('Book', {
    settings: {
        width: 320,
        height: 521,
        minSpreadWidth: 320,
        gap: 'auto',
        bookKey: '',
        reload: false,
        forceSingle: false,
        goto: '',
        styles: {},
        headTags: {},
        container: '',
        spread: 'none',
        direction: 'ltr'
    },

    globalLayoutProperties: '',

    spinePos: 0,

    view: '',

    //startQ: [],

    chapters: [],

    totalPages: 0,

    currentPage: 0,

    constructor: function(_settings, _blob, _$q, _$scope) {
        this.settings = angular.extend({}, this.settings, _settings);
        this._super([_blob, _$q, _$scope]);
        isDestroying = false;
        return this;
    },

    generatePages: function() {
        var book = this,
            deferred = book.$q.defer();
        book.ready.promise
            .then(function() {
                generatePageList(book)
                    .then(function() {
                        deferred.resolve(book)
                    }, function() {
                      deferred.reject();
                    });
            });
        return deferred.promise;
    },

    trigger: function(event, value) {
        this.$scope.$emit(event, {sender: this, value: value});
    },

    on: function(event, callback) {
        this.$scope.$on(event, callback);
    },

    show: function() {
        var self = this;
        function onReady() {
            self.view = createBookView(self);
            self.trigger(BookEvent.VIEWCREATED, self.view);
            self.view.on(BookEvent.VISIBLERANGECHANGED, function(event, data) {
                self.currentPage = data.value;
                self.trigger(BookEvent.PAGECHANGED, self.currentPage);
            });
            //self.startQ.flush();
            return self.settings.goto ? self.goto(self.settings.goto) : self.showChapter(self.spinePos);
        }
        return self.ready.promise.then(onReady);
    },

    goto: function(arg) {
        if (angular.isNumber(arg)) this.gotoPage(arg);
    },

    gotoPage: function(page) {
        var self = this,
            chapters = this.chapters,
            spinePos = 0,
            pages = 0,
            pagesPlus,
            chapter;

        function go() {
            self.view.page(page - pages);
        }

        while (spinePos < chapters.length) {
            chapter = chapters[spinePos];
            pagesPlus = pages + chapter.pages.pageCount;
            if (pagesPlus >= page) break;
            pages = pagesPlus;
            spinePos++;
        }

        if (chapter.spinePos === this.view.currentChapter.spinePos) {
            go();
        } else {
            this.showChapter(spinePos)
                .then(function() {
                    go();
                });
        }
    },

    gotoHref: function(url) {
        var split = url.split('#'),
            chapter = split[0],
            section = split[1] || false,
            relativeURL = chapter.replace(this.settings.contentsPath, ''),
            spinePos = this.spineIndexByURL[relativeURL],
            currentChapter = this.view.currentChapter,
            deferred = this.$q.defer();

        //try to search by id
        if (!spinePos) {
            for (var i = 0; i < this.spine.length; i++) {
                if (this.spine[i].id === relativeURL) {
                    spinePos = i;
                    break;
                }
            }
        }

        //-- If link fragment only stay on current chapter
        if (!chapter) {
            spinePos = currentChapter ? currentChapter.spinePos : 0;
        }

        //-- Check that URL is present in the index, or stop
        if (typeof(spinePos) != 'number') return false;

        if (!currentChapter || spinePos != currentChapter.spinePos) {
            //-- Load new chapter if different than current
            return this.showChapter(spinePos)
                .then(function() {
                    if (section) {
                        this.view.section(section);
                    }
                    deferred.resolve();
                }.bind(this));
        } else {
            //--  Goto section
            if (section) {
                this.view.section(section);
            } else {
                // Or jump to the start
                this.view.page(1);
            }
            deferred.resolve();
        }
    },

    showChapter: function(chapterIndex, atEnd, _deferred) {
        var self = this,
            chapter = self.chapters[chapterIndex] || new Chapter(this.spine[chapterIndex], this);
        return this.view.displayChapter(chapter)
            .then(function(view) {
                self.spinePos = chapterIndex;
                if (atEnd) view.page(chapter.pages.displayedPages);
                return view;
            });
    },

    nextPage: function() {
        return !this.view.nextPage() ? this.nextChapter() : null;
    },

    prevPage: function() {
        return ! this.view.prevPage() ? this.prevChapter(): null;
    },

    firstPage: function() {},

    lastPage: function() {},

    nextChapter: function() {
        var next;
        if (this.spinePos < this.spine.length - 1) {
            next = this.spinePos + 1;
            // Skip non linear chapters
            while (this.spine[next] && this.spine[next]['linear'] && this.spine[next]['linear'] == 'no') {
                next++;
            }
            if (next < this.spine.length) {
                return this.showChapter(next);
            } else {
                this.trigger('book:atEnd');
            }

        } else {
            this.trigger('book:atEnd');
        }
    },

    prevChapter: function() {
        var prev;
        if (this.spinePos > 0) {
            prev = this.spinePos - 1;
            while (this.spine[prev] && this.spine[prev]['linear'] && this.spine[prev]['linear'] == 'no') {
                prev--;
            }
            if (prev >= 0) {
                return this.showChapter(prev, true);
            } else {
                this.trigger('book:atStart');
            }
        } else {
            this.trigger('book:atStart');
        }
    },

    destroy: function() {
        if (this.view) this.view.destroy();
        isDestroying = true;
        this._super();
    }
});

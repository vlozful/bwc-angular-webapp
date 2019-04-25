import angular from "angular";
import Class from "../lib/Class";
import BookEvent from "./BookEvent";
import U from "./Utils";
import R from "./Replace";


var HIDDEN = 'hidden',
    HORIZONTAL = 'horizontal',
    AUTO = 'auto',
    REFLOWABLESPREADS = 'ReflowableSpreads',
    REFLOWABLE = 'Reflowable',
    FIXED = 'Fixed',
    columnAxis = U.prefixed('columnAxis'),
    columnGap = U.prefixed('columnGap'),
    columnWidth = U.prefixed('columnWidth'),
    columnFill = U.prefixed('columnFill');

function loadedHandler() {
    var url = this.element.contentWindow.location.href;
    this.left = 0;
    this.document = this.element.contentDocument;
    this.documentEl = this.document.documentElement;
    this.headEl = this.document.head;
    this.bodyEl = this.document.body || this.document.querySelector('body');
    this.window = this.element.contentWindow;

    //-- Clear Margins
    if (this.bodyEl) {
        this.bodyEl.style.margin = '0';
        this.bodyEl.style.padding = '0';
    }

    if (url != 'about:blank') {
        this.trigger(BookEvent.IFRAMELOADED, url);
        if (this.iFrameReady) this.iFrameReady.resolve(this);
    }

    if (this.direction === 'rtl' || this.documentEl.dir === 'rtl') {
        this.documentEl.dir = 'rtl';
        this.direction = 'rtl';
        this.documentEl.style.position = 'absolute';
        this.documentEl.style.right = '0';
    }
}

function errorLoadedHandler(e) {
    if (this.iFrameReady) this.iFrameReady.reject({
            message: 'Error Loading Contents: ' + e,
            stack: new Error().stack
        });
}

function getChapterLayout(globalSettings, chapterProperties) {
    var settings = angular.extend({}, globalSettings);

    chapterProperties.forEach(function(prop) {
        var rendition = prop.replace('rendition:', '');
        var split = rendition.indexOf('-');
        var property, value;

        if (split != -1) {
            property = rendition.slice(0, split);
            value = rendition.slice(split + 1);
            settings[property] = value;
        }
    });
    return settings;
}

function determineLayout(view) {
    var spreads = !(view.isForcedSingle || !view.minSpreadWidth || this.width < view.minSpreadWidth),
        layoutMethod = spreads ? REFLOWABLESPREADS : REFLOWABLE,
        scroll = false;

    switch (view.settings.layout) {
        case 'pre-paginated':
            layoutMethod = FIXED;
            scroll = true;
            spreads = false;
        break;
        case 'reflowable':
            if (view.settings.spread === 'none') {
                layoutMethod = REFLOWABLE;
                spreads = false;
            }
            if (view.settings.spread === 'both') {
                layoutMethod = REFLOWABLESPREADS;
                spreads = true;
            }
        break;
    }
    view.spreads = spreads;
    view.scroll = scroll;
    view.trigger(BookEvent.LAYOUT, layoutMethod);
    return layoutMethod;
}

function applyStyles(view) {
    var styles = view.settings.styles,
        style;
    for (style in styles) {
        if (styles.hasOwnProperty(style)) view.setStyle(style, styles[style]);
    }
}

function applyHeadTags(view) {
    var headTags = view.settings.headTags,
        tag;
    for (tag in headTags) {
        if (headTags.hasOwnProperty(tag)) view.addHeadTag(tag, headTags[tag]);
    }
}

function formatLayout(view) {

    function setStyle(width, height, colwidth, colgap) {
        var style = view.documentEl.style;
        style.overflow = HIDDEN;
        style.width = width + 'px';
        style.height = height + 'px';
        style[columnAxis] = HORIZONTAL;
        style[columnFill] = AUTO;
        style[columnWidth] = colwidth + 'px';
        style[columnGap] = colgap + 'px';
    }

    switch (view.layoutMethod) {
        case FIXED: break;
        case REFLOWABLE:
            //-- Single Page
            //-- Check the width and create even width columns
            var width = Math.floor(view.width),
                section = Math.floor(width / 8),
                gap = (view.gap >= 0) ? view.gap : ((section % 2 === 0) ? section : section - 1);
            setStyle(width, view.height, width, gap);
            view.spreadWidth = (width + gap);
            view.colWidth = width;
            view.gap = gap;
            view.pageWidth = view.spreadWidth;
            view.pageHeight = view.height;
        break;
        case REFLOWABLESPREADS: break;
    }
}

export default Class.create('BookView', {

    settings: {
        width: '',
        height: '',
        container: '',
        styles: {},
        headTags: {},
        visible: true
    },

    controller: '',

    element: '',

    document: '',

    headEl: '',

    bodyEl: '',

    window: '',

    documentEl: '',

    width: 0,

    height: 0,

    gap: 0,

    spreadWidth: 0,

    colWidth: 0,

    pageWidth: 0,

    pageHeight: 0,

    left: 0,

    direction: '',

    renderQ: [],

    layoutSettings: {},

    layoutMethod: '',

    spreads: true,

    scroll: false,

    isForcedSingle: false,

    rendering: false,

    iFrameReady: '',

    currentChapter: '',

    chapterPos: 0,

    caches: {},

    $q: '',

    $scope: '',

    replaces: '',

    constructor: function(_settings) {
        var s = {},
        el = this.element = document.createElement('iframe');
        
        angular.extend(s, this.settings, _settings);
        this.controller = _settings.controller;
        this.$q = this.controller.$q;
        this.$scope = this.controller.$scope;
        if (!s.container) {
            console.error('No container specified');
            return false;
        }
        this.settings = s;
        //initialize replaces
        R(this.$q);
        this.renderQ = U.queue(this);
        el['id'] = s.id || this.settings.id;
        el['scrolling'] = 'no';
        el['seamless'] = 'seamless';
        el['style']['border'] = 'none';

        this.width = s.width || s.container.clientWidth;
        this.height = s.height || s.container.clientHeight;

        //s.container.appendChild(el);
        angular.element(s.container).prepend(el);
        this.resize(this.width, this.height);
        loadedHandler.call(this);
        el.addEventListener('load', loadedHandler.bind(this), false);
    },

    trigger: function(event, value) {
        this.$scope.$emit(event, {sender: this, value: value});
    },

    on: function(event, callback) {
        this.$scope.$on(event, callback);
    },

    resize: function(width, height) {
        if (!this.element) return;
        width = width || '100%';
        this.height = this.element['height'] = height || '100%';
        if (!isNaN(width) && width % 2 !== 0) {
            width += 1; //-- Prevent cutting off edges of text in columns
        }
        this.width = this.element['width'] = width;
    },

    setStyle: function(style, val, prefixed) {
        if (prefixed) {
            style = U.prefixed(style);
        }
        if (this.bodyEl) this.bodyEl['style'][style] = val;
    },

    setGap: function(gap) {
        this.gap = gap;
    },

    addHeadTag: function(tag, attrs, _doc) {
        var doc = _doc || this.document,
            tagEl = doc.createElement(tag),
            headEl = doc['head'],
            attr;

        for (attr in attrs) {
            if (attrs.hasOwnProperty(attr)) tagEl.setAttribute(attr, attrs[attr]);
        }

        if (headEl) headEl.insertBefore(tagEl, headEl.firstChild);
    },

    displayChapter: function(chapter, _layout) {
        var self = this,
            deferred = self.$q.defer(),
            layout = _layout || {layout: 'reflowable', spread: 'auto', orientation: 'auto'};

        if (self.rendering) {
            console.error('Rendering In Progress');
            deferred.reject();
            return deferred.promise;
        }

        function chapterUrlReady(url) {
            if (self.currentChapter) {
                self.currentChapter.unload();
                self.trigger(BookEvent.CHAPTERUNLOADED);
                //self.contents = null;
                //self.doc = null;
                //self.pageMap = null;
            }
        }
        
        function render() {
            self.iFrameReady = self.$q.defer();
            self.currentChapter = chapter;
            self.chapterPos = 1;
            self.layoutSettings = getChapterLayout(layout, chapter.properties);
            self.layoutMethod = determineLayout(self);
            self.visible(false);
            self.window.location.replace(chapter.url);
            return self.iFrameReady.promise.then(afterRender);
        }

        function afterRender() {
            applyStyles(self);
            applyHeadTags(self);
            formatLayout(self);
            R().hrefs(self)
                .then(function() {
                    R().head(self)
                        .then(function() {
                            R().resources(self)
                                .then(function() {
                                    R().images(self)
                                        .then(function() {
                                            self.visible(true);
                                            self.trigger(BookEvent.VISIBLERANGECHANGED, self.getVisibleRange());
                                            self.rendering = false;
                                            deferred.resolve(self);
                                        });
                                });
                        });
                });
            return self;
        }

        self.rendering = true;
        chapter.getUrl().then(chapterUrlReady).then(render);
        return deferred.promise;
    },

    calculatePages: function() {
        var totalWidth, displayedPages;

        switch (this.layoutMethod) {
            case FIXED: break;
            case REFLOWABLE:
                this.documentEl.style.width = AUTO; //-- reset width for calculations
                totalWidth = this.documentEl.scrollWidth;
                displayedPages = Math.ceil(totalWidth / this.pageWidth);
                return {
                    displayedPages: displayedPages,
                    pageCount: displayedPages
                };
            break;
            case REFLOWABLESPREADS: break;
        }
    },

    visible: function(bool) {
        if (typeof(bool) === 'undefined') {
            return this.element.style.visibility;
        }

        if (bool === true && this.settings.visible) {
            this.element.style.visibility = 'visible';
        } else if (bool === false) {
            this.element.style.visibility = 'hidden';
        }
    },

    page: function(number) {
        if (number >= 1 && number <= this.currentChapter.pages.displayedPages) {
            this.chapterPos = number;
            var left = this.left = this.pageWidth * (number - 1); //-- pages start at 1
            if (this.direction === 'rtl') {
                left = left * -1;
            }
            if (navigator.userAgent.match(/(iPad|iPhone|iPod|Mobile|Android)/g)) {
                this.documentEl.style[U.prefixed('transform')] = 'translate(' + (-left) + 'px, 0)';
            } else {
                this.document.defaultView.scrollTo(left, 0);
            }
                this.trigger(BookEvent.VISIBLERANGECHANGED, this.getVisibleRange());
            return true;
        }
        return false;
    },

    nextPage: function() {
        return this.page(this.chapterPos + 1);
    },

    prevPage: function() {
        return this.page(this.chapterPos - 1);
    },

    section: function(fragment) {
        var el = this.document.getElementById(fragment);
        if (el) {
            this.page(this.pageByElement(el));
        }
    },

    pageByElement: function(el) {
        if (!el) return;
        var left = this.left + el.getBoundingClientRect()['left']; //-- Calculate left offset compared to scrolled position
        return Math.floor(left / this.pageWidth) + 1; //-- pages start at 1
    },

    replace: function(query, callback, finished, progress) {
        var items = this.documentEl.querySelectorAll(query),
            resources = Array.prototype.slice.call(items),
            count = resources.length,
            deferred = this.$q.defer();

        if (count === 0) {
            if (finished) finished(false);
            deferred.resolve(false);
            return deferred.promise;
        }
        resources.forEach(function(item) {
            var called = false;
            function after(result, full) {
                if (called === false) {
                    count--;
                    if (progress) progress(result, full, count);
                    if (count <= 0) {
                        if (finished) finished(true);
                        deferred.resolve(true);
                    }
                    called = true;
                }
            }
            if (callback) callback(item, after);
        }.bind(this));
        return deferred.promise;
    },

    replaceWithStored: function(query, attr, func) {
        var deferred = this.$q.defer();
        if (this.currentChapter.isRendered) {
            deferred.resolve();
            return deferred.promise;
        }
        var self = this,
            _oldUrls,
            _newUrls = {},
            _store = self.currentChapter.model,
            _cache = self.caches[query],
            _uri = U.uri(self.currentChapter.absolute),
            _chapterBase = _uri.base,
            _attr = attr,
            _wait = 2000;

        if (!_store) return;

        function progress(url, full, count) {
            _newUrls[full] = url;
        }

        function finished(notempty) {
            angular.forEach(_oldUrls, function(url) {
                _store.revokeUrl(url);
            });
            _cache = _newUrls;
            deferred.resolve();
        }

        if (!_cache) _cache = {};
        _oldUrls = angular.extend({}, _cache);

        this.replace(query, function(link, done) {
            var src = link.getAttribute(_attr),
                full = U.resolveURL(_chapterBase, src);

            var replaceUrl = function(url) {
                var timeout;
                link.onload = function() {
                    clearTimeout(timeout);
                    done(url, full);
                };

                link.onerror = function(e) {
                    clearTimeout(timeout);
                    done(url, full);
                    console.error(e);
                };

                if (query == 'image') {
                    //-- SVG needs this to trigger a load event
                    link.setAttribute('externalResourcesRequired', 'true');
                }

                if (query == 'link[href]' && link.getAttribute('rel') !== 'stylesheet') {
                    //-- Only Stylesheet links seem to have a load events, just continue others
                    done(url, full);
                }

                link.setAttribute(_attr, url);

                //-- If elements never fire Load Event, should continue anyways
                timeout = setTimeout(function() {
                    done(url, full);
                }, _wait);
            };

            if (full in _oldUrls) {
                replaceUrl(_oldUrls[full]);
                _newUrls[full] = _oldUrls[full];
                delete _oldUrls[full];
            } else {
                func(_store, full, replaceUrl, link);
            }
        }, finished, progress);
        return deferred.promise;
    },

    getVisibleRange: function() {
        var chapters = this.controller.chapters,
            pagesBefore = 0,
            i = 0;
        while (i < this.currentChapter.spinePos) {
            pagesBefore += chapters[i].pages.pageCount;
            i++;
        }
        return pagesBefore + this.chapterPos;
    },

    destroy: function() {
        this.settings.container.removeChild(this.element);
        R().destroy();
    }
});

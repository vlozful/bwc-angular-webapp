import angular from "angular";
import U from "./Utils";

var $q,
    cache = {};

/* */
function _srcs(_store, full, done) {
    _store.getUrl(full).then(done);
}

/* */
function _hrefs(view) {
    var book = view.controller;
    function replacements(link, done) {
        var href = link.getAttribute('href'),
            isRelative = href.search('://'),
            directory,
            relative,
            location;

        if (isRelative != -1) {
            link.setAttribute('target', '_blank');
        } else {
            // Links may need to be resolved, such as ../chp1.xhtml
            directory = U.uri(view.window.location.href).directory;
            if (directory) {
                relative = U.resolveURL(directory, href);
            } else {
                relative = href;
            }
            link.onclick = function() {
                book.gotoHref(relative);
                return false;
            };

        }
        done();
    }
    return view.replace('a[href]', replacements);
}

/* */
function _head(view) {
    return view.replaceWithStored('link[href]', 'href', _links);
}

/* */
function _resources(view) {
    return view.replaceWithStored('[src]', 'src', _srcs);
}

/* */
function _svg(view) {
    return view.replaceWithStored('image', 'xlink:href', function(_store, full, done) {
        _store.getUrl(full).then(done);
    });
}

/* */
function _links(_store, full, done, link) {
    //-- Handle replacing urls in CSS
    if (link.getAttribute('rel') === 'stylesheet') {
        _stylesheets(_store, full)
            .then(function(url, full) {
                // done
                setTimeout(function() {
                done(url, full);
                }, 3); //-- Allow for css to apply before displaying chapter
            }, function(reason) {
                // we were unable to replace the style sheets
                done(null);
            });
    } else {
        _store.getUrl(full).then(done, function(reason) {
            // we were unable to get the url, signal to upper layer
            done(null);
        });
    }
}

/* */
function _stylesheets(_store, _url) {
    if (!_store) return;
    var deferred = $q.defer();

    if (_url in cache) {
        deferred.resolve(cache[_url]);
    } else {
        _store.getText(_url)
            .then(function(text) {
                _cssUrls(_store, _url, text)
                    .then(function(newText) {
                            var blob = new Blob([newText], {'type': 'text\/css'}),
                                url = U.createObjectUrl(blob);
                            cache[_url] = url;
                            deferred.resolve(url);
                        }, function(reason) {
                            deferred.reject(reason);
                        });
            }, function(reason) {
                deferred.reject(reason);
            });
    }
    return deferred.promise;
}

/* */
function _cssUrls(_store, base, text) {
    if (!_store) return;
    var deferred = $q.defer(),
        promises = [],
        matches = text.match(/url\(\'?\"?([^\'|^\"^\)]*)\'?\"?\)/g);

        if (!matches) {
        deferred.resolve(text);
        return deferred.promise;
    }
    matches.forEach(function(str) {
        var full = U.resolveURL(base, str.replace(/url\(|[|\)|\'|\"]/g, '')),
            replaced = _store.getUrl(full)
                .then(function(url) {
                    text = text.replace(str, 'url("' + url + '")');
                }, function(reason) {
                    deferred.reject(reason);
                });
        promises.push(replaced);
    });
    $q.all(promises).then(function() {
        deferred.resolve(text);
    });
    return deferred.promise;
}

/* */
function _images(view) {
    var d = $q.defer();
    if(view.currentChapter.isRendered) {
        d.resolve();
        return d.promise;
    }
    var images = view.documentEl.querySelectorAll('img'),
        items = Array.prototype.slice.call(images);

    function size() {
        var itemRect = this.getBoundingClientRect(),
            rectHeight = itemRect.height,
            top = itemRect.top,
            oHeight = this.getAttribute('data-height'),
            height = oHeight || rectHeight,
            newHeight,
            fontSize = Number(window.getComputedStyle(this, '').fontSize.match(/(\d*(\.\d*)?)px/)[1]),
            fontAdjust = fontSize ? fontSize / 2 : 0,
            style = this.style,
            iHeight = view.documentEl.clientHeight;

        if (top < 0) top = 0;

        if (height + top >= iHeight) {
            if (top < iHeight / 2) {
                // Remove top and half font-size from height to keep container from overflowing
                newHeight = iHeight - top - fontAdjust;
                style.maxHeight = newHeight + 'px';
                style.width = 'auto';
            } else {
                if (height > iHeight) {
                    style.maxHeight = iHeight + 'px';
                    style.width = 'auto';
                    itemRect = this.getBoundingClientRect();
                    height = itemRect.height;
                }
                style.display = 'block';
                style['WebkitColumnBreakBefore'] = 'always';
                style['breakBefore'] = 'column';
            }

            this.setAttribute('data-height', newHeight);

        } else {
            style.removeProperty('max-height');
            style.removeProperty('margin-top');
        }
    }

    //-- Only adjust images for reflowable text
    if (view.layoutSettings.layout != 'reflowable') {
        return;
    }

    items.forEach(function(item) {
        item.addEventListener('load', size, false);
        view.on('renderer:resized', size);
        view.on('renderer:chapterUnloaded', function() {
            item.removeEventListener('load', size);
            view.off('renderer:resized', size);
        });
        size.call(item);
    });
    d.resolve();
    return d.promise;
}

function _destroy() {
    angular.forEach(cache, function(value, key) {
        U.revokeObjectUrl(value);
        delete cache[key];
    });
}

export default function(_$q) {
    if (!$q && !_$q) throw ('No deferred in arguments');
    if (!$q) $q = _$q;
    return {
        hrefs: _hrefs,
        head: _head,
        resources: _resources,
        svg: _svg,
        srcs: _srcs,
        links: _links,
        stylesheets: _stylesheets,
        cssUrls: _cssUrls,
        images: _images,
        destroy: _destroy
    };
}

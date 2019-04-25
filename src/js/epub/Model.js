import angular from "angular";
import Class from "../lib/Class";
import U from "./Utils";
import Parser from "./Parser";
import "./Mime";

import JSZip from "jszip";

function generateBookKey(id) {
    return 'epub:' + window.location.host + ':' + id;
}

function decodeUrl(url) {
    return window['decodeURIComponent'](url);
}

function getEntry(url, model) {
    return model.store.file(decodeUrl(url));
}

function error(deferred, url) {
    deferred.reject({
        'message': 'File not found in the epub: ' + url,
        'stack': new Error().stack
    });
    return deferred.promise;
}

function loadContainer(model, _containerPath) {
    var containerPath = _containerPath || 'META-INF/container.xml',
        containerPromise = model.getXML(containerPath)
        .then(function(containerXML) {
            return Parser.getContainer(containerXML);
        })
        .then(function(container) {
            model.contentsPath = container.basePath;
            model.packageUrl = container.packagePath;
            model.encoding = container.encoding;
            return model.getXML(model.packageUrl);
        });

    containerPromise.catch(function(error) {
        console.error('Could not load book at: ' + containerPath, error);
        model.trigger('book:loadFailed', containerPath);
    });
    return containerPromise;
}

function parse(model, packageXML) {
    var contents = Parser.getPackageContents(packageXML, model.contentsPath);

    model.manifest = contents.manifest;
    model.spine = contents.spine;
    model.spineIndexByURL = contents.spineIndexByURL;
    model.spineNodeIndex = contents.spineNodeIndex;
    model.metadata = contents.metadata;
    model.navPath = contents.navPath;
    model.tocPath = contents.tocPath;

    if (!model.bookKey) {
        model.bookKey = generateBookKey(model.metadata.identifier);
    }

    if (contents.coverPath) {
        model.coverPath = model.contentsPath + contents.coverPath;
    }

    //-- Load the TOC, optional; either the EPUB3 XHTML
    // Navigation file or the EPUB2 NCX file
    if (model.navPath) {
        model.navUrl = model.contentsPath + contents.navPath;
        model.getXML(model.navUrl)
            .then(function(navHtml) {
                // Grab Table of Contents
                return Parser.getNav(navHtml, model.spineIndexByURL, model.spine);
            })
            .then(function(toc) {
                model.toc = toc;
                //model.ready.toc.resolve(model.contents.toc);
            }, function(error) {
                console.error(CANNOTRESOLVETOC, error);
                model.ready.resolve(false);
            });
    } else if (model.tocPath) {
        model.tocUrl = model.contentsPath + model.tocPath;
        model.getXML(model.tocUrl)
            .then(function(tocXml) {
                // Grab Table of Contents
                return Parser.getToc(tocXml, model.spineIndexByURL, model.spine);
            })
            .then(function(toc) {
                model.toc = toc;
            }, function(error) {
                console.error('Can not resolve TOC', error);
                model.ready.resolve(false);
            });
    } else {
        console.error('Can not find toc path');
        model.ready.resolve(false);
    }
}

export default Class.extend('Model', {

    manifest: '',

    spine: '',

    toc: '',

    spineIndexByURL: '',

    spineNodeIndex: '',

    metadata: '',

    contentsPath: '',

    packageUrl: '',

    encoding: '',

    coverPath: '',

    navUrl: '',

    tocUrl: '',

    urlCache: {},

    ready: '',

    store: null,

    $q: '',

    $scope: '',

    constructor: function(_blob, _$q, _$scope) {
        var self = this;
        self.$q = _$q;
        self.ready = _$q.defer();
        self.$scope = _$scope;
        self.store = new JSZip(_blob);
        loadContainer(self, '')
            .then(function(pkg) {
                parse(self, pkg);
                self.ready.resolve(self);
                return self;
            });
    },

    getXML: function(url, encoding) {
    return this.getText(url, encoding)
        .then(function(text) {
            return new DOMParser().parseFromString(text, 'text/xml');
        });
    },

    getText: function(url, encoding) {
        var deferred = this.$q.defer(),
            entry = getEntry(url, this);

        if (!entry) {
            return error(deferred, url);
        }

        deferred.resolve(entry['asText']());
        return deferred.promise;
    },

    getUrl: function(url, mime, again) {
        var self = this,
            deferred = self.$q.defer(),
            entry = getEntry(url, self),
            tempUrl,
            blob;

        if (!entry) {
            return error(deferred, url);
        }


        /*if (url in self.urlCache) {
            if (!again) {
                deferred.resolve(self.urlCache[url]);
                return deferred.promise;
            } self.revokeUrl(url);
        }*/

        blob = new Blob([entry['asUint8Array']()], {
            type: mime || self.store['getMimeType'](entry.name)
        });

        tempUrl = U.createObjectUrl(blob);
        deferred.resolve(tempUrl);
        //self.urlCache[url] = tempUrl;
        return deferred.promise;
    },

    revokeUrl: function(url) {
        var fromCache = this.urlCache[url];
        if (fromCache) {
            U.revokeObjectUrl(fromCache);
            delete(this.urlCache[url]);
        }
    },

    destroy: function() {
        angular.forEach(this.urlCache, function(value, key) {
            U.revokeObjectUrl(value);
        });
    }
});

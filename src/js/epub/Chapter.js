import Class from "../lib/Class";

export default Class.create('Chapter', {
    href: '',
    absolute: '',
    id: '',
    spinePos: '',
    properties: '',
    isRendered: false,
    manifestProperties: '',
    linear: '',
    pages: -1,
    model: '',
    url: '',

    constructor: function(spineObject, model) {
        this.$q = model.$q;
        this.href = spineObject.href;
        this.absolute = spineObject.url;
        this.id = spineObject.id;
        this.spinePos = spineObject.index;
        this.properties = spineObject.properties;
        this.manifestProperties = spineObject.manifestProperties;
        this.linear = spineObject.linear;
        this.model = model;
    },

    getUrl: function(again) {
        var deferred = this.$q.defer(),
            chapter = this,
            url;

        if (!chapter.url || again) {
            chapter.model.getUrl(chapter.absolute, null, again)
                .then(function(url) {
                    chapter.url = url;
                    deferred.resolve(url);
                });
        } else {
            url = chapter.url;
            deferred.resolve(url);
        }

        return deferred.promise;
    },

    unload: function() {
        if (this.url) {
            this.model.revokeUrl(this.url);
            this.url = '';
        }
    }
});

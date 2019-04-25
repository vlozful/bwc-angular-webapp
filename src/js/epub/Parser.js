import U from "./Utils";

function getListItems(parent) {
    var items = [];
    [].slice.call(parent.childNodes).forEach(function(node) {
        if ('ol' == node.tagName) {
            [].slice.call(node.childNodes).forEach(function(item) {
                if ('li' == item.tagName) {
                    items.push(item);
                }
            });
        }
    });
    return items;
}

function getAnchorOrSpan(parent) {
    var item = null;

    [].slice.call(parent.childNodes).forEach(function(node) {
        if ('a' == node.tagName || 'span' == node.tagName) {
            item = node;
        }
    });

    return item;
}

function getContainer(containerXml) {
    if (!containerXml) {
        console.error('Container File Not Found');
        return;
    }
    var rootFile = containerXml.querySelector('rootfile'),
        fullPath,
        folder,
        encoding;

    if (!rootFile) {
        console.error('No RootFile Found');
        return;
    }

    fullPath = rootFile.getAttribute('full-path');
    folder = U.uri(fullPath).directory;
    encoding = containerXml.xmlEncoding;

    //-- Now that we have the path we can parse the contents
    return {
        packagePath: fullPath,
        basePath: folder,
        encoding: encoding
    };
}

function getIdentifier(packageXml) {
    if (!packageXml) {
        console.error('Package File Not Found');
        return;
    }
    var metadataNode = packageXml.querySelector('metadata');

    if (!metadataNode) {
        console.error('No Metadata Found');
        return;
    }
    return getElementText(metadataNode, 'identifier');
}

function getElementText(xml, tag) {
    var found = xml.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', tag),
        el;

    if (!found || found.length === 0) return '';
    el = found[0];

    return (el.childNodes.length) ? el.childNodes[0].nodeValue : '';
}

function querySelectorText(xml, q) {
    var el = xml.querySelector(q);
    return (el && el.childNodes.length) ? el.childNodes[0].nodeValue : '';
}

  //-- Find TOC NAV
function getNavPath(manifestNode) {
    var node = manifestNode.querySelector('item[properties$="nav"], ' + 'item[properties^="nav "], ' + 'item[properties*=" nav "]');
    return node ? node.getAttribute('href') : false;
}

function getCoverPath(manifestNode) {
    var node = manifestNode.querySelector('item[properties="cover-image"]');
    return node ? node.getAttribute('href') : false;
}

function getSpine(spineXml, manifest) {
    var spine = [],
        nonLinear = [],
        selected = spineXml.getElementsByTagName('itemref'),
        items = [].slice.call(selected);

    items.forEach(function(item, index) {
        var id = item.getAttribute('idref'),
            props = item.getAttribute('properties') || '',
            propArray = props.length ? props.split(' ') : [],
            manifestProps = manifest[id].properties,
            manifestPropArray = manifestProps.length ? manifestProps.split(' ') : [];

        spine.push({
            id: id,
            linear: item.getAttribute('linear') || '',
            properties: propArray,
            manifestProperties: manifestPropArray,
            href: manifest[id].href,
            url: manifest[id].url,
            index: index
        });
    });
    return spine;
}

function getPackageContents(packageXml, basePath) {
    if (!packageXml) {
        console.error('Package File Not Found');
        return;
    }
    var metadataNode = packageXml.querySelector('metadata'),
        manifestNode = packageXml.querySelector('manifest'),
        spineNode = packageXml.querySelector('spine'),
        manifest, navPath, tocPath, coverPath,
        spineNodeIndex, spine, metadata,
        spineIndexByURL = {};

    if (!metadataNode) {
        console.error('No Metadata Found');
        return;
    }

    if (!manifestNode) {
        console.error('No Manifest Found');
        return;
    }

    if (!spineNode) {
        console.error('No Spine Found');
        return;
    }

    manifest = getManifest(manifestNode, basePath);
    navPath = getNavPath(manifestNode);
    tocPath = getTocPath(manifestNode, spineNode);
    coverPath = getCoverPath(manifestNode);

    spineNodeIndex = Array.prototype.indexOf.call(spineNode.parentNode.childNodes, spineNode);

    spine = getSpine(spineNode, manifest);

    spine.forEach(function(item) {
        spineIndexByURL[item.href] = item.index;
    });

    metadata = getMetadata(metadataNode);

    metadata.direction = spineNode.getAttribute('page-progression-direction');

    return {
        metadata: metadata,
        spine: spine,
        manifest: manifest,
        navPath: navPath,
        tocPath: tocPath,
        coverPath: coverPath,
        spineNodeIndex: spineNodeIndex,
        spineIndexByURL: spineIndexByURL
    };
}

  //-- Get TOC NCX
function getTocPath(manifestNode, spineNode) {
    var node = manifestNode.querySelector('item[media-type="application/x-dtbncx+xml"]'),
        tocId;

    // If we can't find the toc by media-type then try to look
    // for id of the item in the spine attributes as according to
    // http://www.idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2,
    // 'The item that describes the NCX must be referenced by the spine
    // toc attribute.'
    if (!node) {
        tocId = spineNode.getAttribute('toc');
        if (tocId) {
            node = manifestNode.querySelector('item[id="' + tocId + ']');
        }
    }

    return node ? node.getAttribute('href') : false;
}

function getToc(tocXml, spineIndexByURL, bookSpine) {
    var navMap = tocXml.querySelector('navMap');
    if (!navMap) return [];

    function _getTOC(parent) {
        var list = [],
            snapshot = tocXml.evaluate('*[local-name()="navPoint"]', parent, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
            length = snapshot.snapshotLength;

        if (length === 0) return [];

        for (var i = length - 1; i >= 0; i--) {
            var item = snapshot.snapshotItem(i),
                id = item.getAttribute('id') || false,
                content = item.querySelector('content'),
                src = content.getAttribute('src'),
                navLabel = item.querySelector('navLabel'),
                text = navLabel.textContent ? navLabel.textContent : '',
                split = src.split('#'),
                baseUrl = split[0],
                spinePos = spineIndexByURL[baseUrl],
                spineItem = bookSpine[spinePos],
                subitems = _getTOC(item),
                idCounter = 0,
                cfi = spineItem ? spineItem.cfi : '';

            if (!id) {
                if (spinePos) {
                    spineItem = bookSpine[spinePos];
                    id = spineItem.id;
                    cfi = spineItem.cfi;
                } else {
                    id = 'epubjs-autogen-toc-id-' + (idCounter++);
                }
            }

            list.unshift({
                id: id,
                href: src,
                label: text,
                spinePos: spinePos,
                subitems: subitems,
                parent: parent ? parent.getAttribute('id') : null,
                cfi: cfi
            });
        }

      return list;
    }

    return _getTOC(navMap);
}

  //-- Expanded to match Readium web components
function getMetadata(xml) {
    return {
        direction: '',
        bookTitle: getElementText(xml, 'title'),
        creator: getElementText(xml, 'creator'),
        description: getElementText(xml, 'description'),
        pubdate: getElementText(xml, 'date'),
        publisher: getElementText(xml, 'publisher'),
        identifier: getElementText(xml, 'identifier'),
        language: getElementText(xml, 'language'),
        rights: getElementText(xml, 'rights'),
        modified_date: querySelectorText(xml, 'meta[property="dcterms:modified"]'),
        layout: querySelectorText(xml, 'meta[property="rendition:layout"]'),
        orientation: querySelectorText(xml, 'meta[property="rendition:orientation"]'),
        spread: querySelectorText(xml, 'meta[property="rendition:spread"]')
    };
}

function getManifest(manifestXml, baseUrl) {
    var manifest = {},
        selected = manifestXml.querySelectorAll('item'),
        items = [].slice.call(selected);

    //-- Create an object with the id as key
    items.forEach(function(item) {
        var id = item.getAttribute('id'),
            href = item.getAttribute('href') || '',
            type = item.getAttribute('media-type') || '',
            properties = item.getAttribute('properties') || '';

        manifest[id] = {
            href: href,
            //-- Absolute URL for loading with a web worker
            url: baseUrl + href,
            type: type,
            properties: properties
        };
    });
    return manifest;
}

function getNav(navHtml, spineIndexByURL, bookSpine) {
    var navEl = navHtml.querySelector('nav[*|type="toc"]'),
        idCounter = 0;

    if (!navEl) return [];

    function _getNAV(parent) {
        var list = [],
            nodes = getListItems(parent),
            items = [].slice.call(nodes),
            length = items.length,
            node;

        if (length === 0) return false;

        items.forEach(function(item) {
            var id = item.getAttribute('id') || false,
                content = getAnchorOrSpan(item),
                href = content.getAttribute('href') || '',
                text = content.textContent || '',
                split = href.split('#'),
                baseUrl = split[0],
                subitems = _getNAV(item),
                spinePos = spineIndexByURL[baseUrl],
                spineItem = bookSpine[spinePos],
                cfi = spineItem ? spineItem.cfi : '';

            if (!id) {
                if (spinePos) {
                    spineItem = bookSpine[spinePos];
                    id = spineItem.id;
                    cfi = spineItem.cfi;
                } else {
                    id = 'epubjs-autogen-toc-id-' + (idCounter++);
                }
            }

            item.setAttribute('id', id); // Ensure all elements have an id
            list.push({
            id: id,
            href: href,
            label: text,
            subitems: subitems,
            parent: parent ? parent.getAttribute('id') : null,
            cfi: cfi
            });

        });
        return list;
    }
    return _getNAV(navEl);
}

export default {
    getContainer: getContainer,
    getPackageContents: getPackageContents,
    getNav: getNav,
    getToc: getToc
};

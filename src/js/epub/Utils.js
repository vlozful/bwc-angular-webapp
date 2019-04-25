import angular from "angular"


var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1,
    URL = window['URL'] || window['webkitURL'] || window['mozURL'],
    currentUUID = 0;

/* */
function _folder(url) {
    var lastSlash = url.lastIndexOf('/');
    return (lastSlash == -1) ? '' : url.slice(0, lastSlash + 1);
}

  /* */
  function _uri(url) {
    var uri = {
                protocol: '',
                host: '',
                path: '',
                origin: '',
                directory: '',
                base: '',
                filename: '',
                extension: '',
                fragment: '',
                href: url
              },
        blob = url.indexOf('blob:'),
        doubleSlash = url.indexOf('://'),
        search = url.indexOf('?'),
        fragment = url.indexOf('#'),
        withoutProtocol,
        dot,
        firstSlash,
        href;

    if (blob === 0) {
      uri.protocol = 'blob';
      uri.base = url.indexOf(0, fragment);
      return uri;
    }

    if (fragment != -1) {
      uri.fragment = url.slice(fragment + 1);
      url = url.slice(0, fragment);
    }

    if (search != -1) {
      uri.search = url.slice(search + 1);
      url = url.slice(0, search);
      href = url;
    }

    if (doubleSlash != -1) {
      uri.protocol = url.slice(0, doubleSlash);
      withoutProtocol = url.slice(doubleSlash + 3);
      firstSlash = withoutProtocol.indexOf('/');

      if (firstSlash === -1) {
        uri.host = uri.path;
        uri.path = '';
      } else {
        uri.host = withoutProtocol.slice(0, firstSlash);
        uri.path = withoutProtocol.slice(firstSlash);
      }
      uri.origin = uri.protocol + '://' + uri.host;
      uri.directory = _folder(uri.path);
      uri.base = uri.origin + uri.directory;
      // return origin;
    } else {
      uri.path = url;
      uri.directory = _folder(url);
      uri.base = uri.directory;
    }
    //-- Filename
    uri.filename = url.replace(uri.base, '');
    dot = uri.filename.lastIndexOf('.');
    if (dot != -1) {
      uri.extension = uri.filename.slice(dot + 1);
    }
    return uri;
  }

  /* */
  function _resolveURL(base, path) {
    var url,
        segments = [],
        uri = _uri(path),
        folders = base.split('/'),
        paths;

    if (uri.host) {
      return path;
    }

    folders.pop();

    paths = path.split('/');
    paths.forEach(function(p) {
      if (p === '..') {
        folders.pop();
      } else {
        segments.push(p);
      }
    });

    url = folders.concat(segments);

    return url.join('/');
  }

  /* */
  function _indexOfTextNode(textNode) {
    var parent = textNode.parentNode,
        children = parent.childNodes,
        sib,
        index = -1,
        i = 0;

    for (; i < children.length; i++) {
      sib = children[i];
      if (sib.nodeType === Node['TEXT_NODE']) {
        index++;
      }
      if (sib == textNode) break;
    }

    return index;
  }

  /* */
  function _getElementTreeXPath(element) {
    var paths = [],
        isXhtml = (element.ownerDocument.documentElement.getAttribute('xmlns') === 'http://www.w3.org/1999/xhtml'),
        index,
        nodeName,
        tagName,
        pathIndex;

    if (element.nodeType === Node['TEXT_NODE']) {
      // index = Array.prototype.indexOf.call(element.parentNode.childNodes, element) + 1;
      index = _indexOfTextNode(element) + 1;

      paths.push('text()[' + index + ']');
      element = element.parentNode;
    }

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == 1; element = element.parentNode)
    {
      index = 0;
      for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
      {
        // Ignore document type declaration.
        if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE) {
          continue;
        }
        if (sibling.nodeName == element.nodeName) {
          ++index;
        }
      }
      nodeName = element.nodeName.toLowerCase();
      tagName = (isXhtml ? 'xhtml:' + nodeName : nodeName);
      pathIndex = (index ? '[' + (index + 1) + ']' : '');
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? './' + paths.join('/') : null;
  }

  /* */
  function _nsResolver(prefix) {
    var ns = {
      'xhtml' : 'http://www.w3.org/1999/xhtml',
      'epub': 'http://www.idpf.org/2007/ops'
    };
    return ns[prefix] || null;
  }

  function _cleanStringForXpath(str)  {
    var parts = str.match(/[^'"]+|['"]/g);
    parts = parts.map(function(part) {
      if (part === "'") {
        return '\"\'\"'; // output "'"
      }

      if (part === '"') {
        return "\'\"\'"; // output '"'
      }
      return "\'" + part + "\'";
    });
    return "concat(\'\'," + parts.join(',') + ')';
  }

  function _queue(_scope) {
    var _q = [],
        scope = _scope;
    // Add an item to the queue
    function enqueue(func, args, context) {
      _q.push({
        func: func,
        args: args,
        context: context
      });
      return _q;
    }

    // Run one item
    function dequeue() {
      var t;
      if (_q.length) {
        t = _q.shift();
        // Defer to any current tasks
        // setTimeout(function(){
        t.func.apply(t.context || scope, t.args);
        // }, 0);
      }
    }

    // Run All
    function flush() {
      while (_q.length) {
        dequeue();
      }
    }

    // Clear all items in wait
    function clear() {
      _q = [];
    }

    function length() {
      return _q.length;
    }

    return {
      enqueue: enqueue,
      dequeue: dequeue,
      flush: flush,
      clear: clear,
      length: length
    };
  }

  //
  function _isArrayLike(collection) {
    var length = collection && collection['length'];
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  }

  //function each(obj, iteratee, context) {

    /**
     * @param {function(...*)} func
     * @param {*} context
     * @param {*=} opt_argCount
     * @return {function(...?):?}
     */
    /*function optimize(func, context, opt_argCount) {
      if (context === void 0) return func;
      switch (opt_argCount == null ? 3 : opt_argCount) {
        case 1: return function(value) {
          return func.call(context, value);
        };
        case 2: return function(value, other) {
          return func.call(context, value, other);
        };
        case 3: return function(value, index, collection) {
          return func.call(context, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
      }
      return function() {
        return func.apply(context, arguments);
      };
    }

    iteratee = optimize(iteratee, context);

    var i, length, key;
    if (_isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) iteratee(obj[key], key, obj);
      }
    }
    return obj;
  }*/

  function _compareFunc(a, b) {
    if (a > b) return 1;
    if (a < b) return -1;
    if (a = b) return 0;
  }

  function _indexOfSorted(item, array, compareFunction, _start, _end) {
    var start = _start || 0,
        end = _end || array.length,
        pivot = parseInt(start + (end - start) / 2, 10),
        compareFunc = compareFunction || _compareFunc,
        compared;

    if (end - start <= 0) {
      return -1; // Not found
    }

    compared = compareFunc(array[pivot], item);
    if (end - start === 1) {
      return compared === 0 ? pivot : -1;
    }
    if (compared === 0) {
      return pivot; // Found
    }
    if (compared === -1) {
      return _indexOfSorted(item, array, compareFunc, pivot, end);
    } else {
      return _indexOfSorted(item, array, compareFunc, start, pivot);
    }
  }

  function _locationOf(item, array, compareFunction, _start, _end) {
    var start = _start || 0,
        end = _end || array.length,
        pivot = parseInt(start + (end - start) / 2, 10),
        compareFunc = compareFunction || _compareFunc,
        compared;

    if (end - start <= 0) {
      return pivot;
    }

    compared = compareFunc(array[pivot], item);
    if (end - start === 1) {
      return compared > 0 ? pivot : pivot + 1;
    }

    if (compared === 0) {
      return pivot;
    }

    if (compared === -1) {
      return _locationOf(item, array, compareFunc, pivot, end);
    } else {
      return _locationOf(item, array, compareFunc, start, pivot);
    }
  }

  function _prefixed(unprefixed) {
    var vendors = ['Webkit', 'Moz', 'O', 'ms'],
        prefixes = ['-Webkit-', '-moz-', '-o-', '-ms-'],
        upper = unprefixed[0].toUpperCase() + unprefixed.slice(1),
        length = vendors.length,
        i = 0;
    if (typeof(document.body.style[unprefixed]) != 'undefined') {
      return unprefixed;
    }
    for (; i < length; i++) {
      if (typeof(document.body.style[vendors[i] + upper]) != 'undefined') {
        return vendors[i] + upper;
      }
    }
    return unprefixed;
  }

  function _getElementXPath(element) {
    if (element && element['id']) {
      return '//*[@id="' + element['id'] + '"]';
    } else {
      return _getElementTreeXPath(element);
    }
  }

  function _createObjectUrl(obj) {
    return URL['createObjectURL'](obj);
  }

  function _revokeObjectUrl(url) {
    return URL['revokeObjectURL'](url);
  }

  function _uuid(obj) {
    currentUUID++;
    if (obj) obj.uuid = currentUUID;
    return currentUUID;
  }

export default {
    prefixed: _prefixed,
    getElementXPath: _getElementXPath,
    getElementTreeXPath: _getElementTreeXPath,
    indexOfTextNode: _indexOfTextNode,
    nsResolver: _nsResolver,
    cleanStringForXpath: _cleanStringForXpath,
    queue: _queue,
    resolveURL: _resolveURL,
    uri: _uri,
    folder: _folder,
    isArrayLike: _isArrayLike,
    //each: each,
    indexOfSorted: _indexOfSorted,
    locationOf: _locationOf,
    createObjectUrl: _createObjectUrl,
    revokeObjectUrl: _revokeObjectUrl,
    uuid: _uuid
};

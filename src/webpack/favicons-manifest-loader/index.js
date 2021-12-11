const path = require('path'),
      steed = require('steed'),
      xmljs = require('xml-js');
      fs = require('fs');

function resolveImageSrc(loaderContext, tile, callback) {

  var dirname = path.dirname(loaderContext.resourcePath),
      options = loaderContext.getOptions();
      src = (tile.attributes) ? tile.attributes.src : tile.src;

  // Resolve the image filename relative to the browserconfig file
  loaderContext.resolve(dirname, src, function(err, filename) {
    if (err) {
      return callback(err);
    }

    // Ensure Webpack knows that the image is a dependency of the browserconfig
    loaderContext.dependency && loaderContext.dependency(filename);

    // Asynchronously pass the image through the loader pipeline
    loaderContext.loadModule(filename, function(err, source, map, module) {
      if (err) {
        return callback(err);
      }

      // Update the image src property to match the generated filename
      var src_new = '/' + options.outputPath + '/' + path.basename(module.request);

      loaderContext.emitFile (options.outputPath + '/' + path.basename(module.request), source);

      if(tile.attributes)
        tile.attributes.src = src_new;
      else
        tile.src = src_new;

      callback(null);
    });
  });
}

function findElements(xmlElement, expectedName) {
  return xmlElement.elements.filter(({ name }) => name === expectedName);
}

function parseBrowserConfig(callback, path) {
  try {
    var contents = fs.readFileSync(path, 'utf8');
    var browserconfig = xmljs.xml2js(contents);
    var tiles = findElements(browserconfig, 'browserconfig')
                    .map((element) => findElements(element, 'msapplication'))
                    .reduce((acc, value) => [].concat(acc).concat(value), [])
                    .map((element) => findElements(element, 'tile'))
                    .reduce((acc, value) => [].concat(acc).concat(value), [])
                    .map((element) => element.elements)
                    .reduce((acc, value) => [].concat(acc).concat(value), [])
                    .filter((element) => element.attributes && element.attributes.src);

    steed.map(tiles, resolveImageSrc.bind(null, this), (error) => {
      if (error) {
        return callback(error);
      }

      var result = xmljs.js2xml(browserconfig, {
        spaces: 2,
        indentAttributes: false,
      })
      
      callback(null, `${result}`);

    });
  } catch (err) {
    return callback(new Error(err));
  }
}

function parseManifestJSON(callback, path) {
  try {
    var json = fs.readFileSync(path, 'utf8')
    var manifest = JSON.parse(json);

    steed.map(manifest.icons, resolveImageSrc.bind(null, this), (error) => {
      if (error) {
        return callback(new Error("Error parsing icons path"));
      } else {
         callback(null, `${JSON.stringify(manifest)}`);
      }
    });
    
  } catch (err) {
    return callback(new Error(err));
  }
}

module.exports = function() {
  const path = this.resourcePath,
    callback = this.async();
   
  if(path.indexOf('.xml') > 0) {
    parseBrowserConfig.bind(this)(callback, path);
  } else if(path.indexOf('.json') > 0) {
    parseManifestJSON.bind(this)(callback, path);
  }
};

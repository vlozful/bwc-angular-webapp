const path = require("path");
const fs = require('fs');
const http = require('http');

module.exports = function (request, response) {
  if(request.query.book) {
    const filePath = path.join(__dirname, request.query.book);
    console.log(request.query);
    try {
        fs.accessSync(filePath);
        /*
        response.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Length': stat.size
        });
        */
        return response.sendFile(filePath);
      } catch (e) {
        console.log("Error: ", e.message);
        return response.status(404);
      }
  } else if(request.query.path) {
      //TODO:: cut extension from path or base64 it
      var dest = path.join(__dirname, './files/tmp.jpg');
      console.log('Creating temp file at ' + dest);
      var file = fs.createWriteStream(dest);
      var cb = function() {
        console.log('Sendng ' + dest);
        return response.sendFile(dest);
      }
      var r = http.get(request.query.path, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          console.log('File at ' + request.query.path + ' loaded');
          file.close(cb);  // close() is async, call cb after close completes.
        });
      }).on('error', function(e) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        console.log("Error: ", e.message);
        return response.status(404);
      });
  } else {
    return response.status(404);
  }
}
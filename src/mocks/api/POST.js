const path = require("path");
const fs = require('fs');

module.exports = function (request, response) {
    const body = request.body;
    var targetFileName;

    console.log('-------------');
    console.log(body);
    console.log('-------------');

    if(body.ajaxCall) {
        if(body.ajaxCall === 'booksSelect'){
          if(body.count == 1 && !body.offset) {
            targetFileName = 'count1.json';
          } else
          if(body.myBook == 1) {
            targetFileName = 'myBooks.' + body.ajaxCall + '.json';
          } else if(body.idGenresList) {
            targetFileName = 'idGenresList.' + body.idGenresList + '.json';
          } else {
            targetFileName = body.ajaxCall + '.json';
          }
        } else {
          targetFileName = body.ajaxCall + '.json';
        }
       
    } else if (body.formName) {
        switch (body.formName) {
            case 'g-themes-webapp-forms-login':
                console.log('Sent login info');
                targetFileName = 'loginResult.json'
            break;
            default:
                return response.send({
                  "result": false,
                  "data": null,
                  "token": null,
                  "errorCode": 81706,
                  "errorMessage": "Method not found: " + body.formName
                });
            break;
        }
    }
    const filePath = path.join(__dirname, targetFileName);
    console.log("trying to send " + filePath);
    try {
        fs.accessSync(filePath);
      }
      catch (err) {
        console.log(err)
        return response.send({
          "result": false,
          "data": null,
          "token": null,
          "errorCode": 81706,
          "errorMessage": "File not found: " + filePath
        });
      }
      console.log("Sending " + filePath);
      response.sendFile(filePath);
  }
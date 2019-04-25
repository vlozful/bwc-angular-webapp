import angular from "angular";
import AC from "../../core/AngularClass";
import Events from "../../constants/Events";

var tokens = [],
      $http,
      $q,
      $rootScope,
      $spinService,
      $isLocalHost,
      gSettings = window['gSettings'],
      isDeveloper = gSettings['DEVELOPER'],
      host,
      ajaxURL,
      formURL;


function urlEncode(data) {
  var str = [],
      params = gSettings['requestParams'],
      p;
  for (p in params) {
    if (params.hasOwnProperty(p) && params[p]) data[p] = params[p];
  }
  for (var p in data)
    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
  return str.join('&');
}

function toJSON(data) {
  console.log("Data to send: ", data);
  return JSON.stringify(data);
}

function htmlDecode(value) {
  return (typeof value === 'undefined') ? '' : angular.element('<div/>').html(value).text();
}

export default AC.extend('HttpService', {

  _$http: '',

  _$q: '',

  showSpinner: true,

  startStopSpinner: function(start) {
    var method = start ? 'spin' : 'stop';
    if (this.showSpinner) $spinService[method]('http-spinner');
  },

  constructor: function(_$rootScope, _$http, _$q, _spinService, _isLocalHost) {
    $http = _$http;
    $q = _$q;
    $spinService = _spinService;
    $rootScope = _$rootScope;
    $isLocalHost = _isLocalHost;

    host = (!_isLocalHost && gSettings && gSettings['backendURL']) ? gSettings['backendURL'] : window['document'].location.protocol + '//' + window['document'].location.host;
    ajaxURL = host + (!_isLocalHost ? '/ajax.php': '/api/'),
    formURL = host + (!_isLocalHost ? '/forms.php': /api/);
  },

  getToken: function() {
    var token = tokens.pop(),
        deferred = $q.defer();
    if (token) {
      deferred.resolve(token);
      return deferred.promise;
    } else {
      return this._doAJAX('authGetToken', {});
    }
  },

  request: function(classMethod, parameters, withToken) {
    var self = this;
    self.startStopSpinner(true);
    parameters = parameters || {};

    if (withToken) {
      return self.getToken().then(
          function(token) {
            return self._doAJAX(classMethod, angular.extend(parameters, {'token': token}));
          }
      );
    } else {
      return this._doAJAX(classMethod, parameters);
    }
  },

  requestWithToken: function(classMethod, parameters) {
    return this.request(classMethod, parameters, true);
  },

  requestFile: function(path, progressCallback, type) {
    this.startStopSpinner(true);
    return this._doAJAX('_getFile', {path: path, type: type || 'blob', onProgress: progressCallback});
  },

  submit: function(formName, parameters) {
    parameters['formName'] = formName;
    parameters['ajaxMode'] = 1;
    return this.request(null, parameters);
  },

  submitWithToken: function(formName, parameters) {
    parameters['formName'] = formName;
    parameters['ajaxMode'] = 1;
    return this.requestWithToken(null, parameters, true);
  },

  _doAJAX: function(classMethod, parameters) {

    var self = this,
        lang = gSettings['idLanguage'],
        httpConfig = isDeveloper ? 
            {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'transformRequest': toJSON
            } 
            : {
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                'transformRequest': urlEncode
            },
        postUrl = classMethod ? ajaxURL : formURL,
        deferred = $q.defer();

    //if (!isDeveloper && config['headers']) delete config['headers']['XDEBUG_SESSION'];

    function successFileCallback(result) {
      deferred.resolve(result['data']);
    }

    function successCallBack(result) {
      var error = null,
          data = result['data'];
      if (
          !data || data['data'] === undefined ||
          data['result'] === undefined ||
          data['errorCode'] === undefined ||
          data['errorMessage'] === undefined ||
          data['token'] === undefined) {    //Check packet format
        error = {errorCode: -1, errorMessage: 'Bad server answer: ' + data};
      }
      if (data['token']) {
        tokens.push(data['token']);
      }
      if (!data['result']) {
        error = {errorCode: data['errorCode'] || parseInt(data, 10), errorMessage: htmlDecode(data['errorMessage']) || data};
      }
      if (error) {
        if (error.errorCode == 401) $rootScope.$broadcast(Events.NEEDAUTH);
        console.log(error);
        if (error.errorCode != 401) alert(error.errorMessage);
        deferred.reject(error);
      } else {
        deferred.resolve(data['data']);
      }
    }

    function errorCallBack(response) {
      var status = response['status'],
          error = {errorCode: -1, errorMessage: 'Ajax error: ' + status + ' ' + response['statusText']};

      console.log(error);
      if (status == 0 || (status = -1 && !response['data'] && !response['statusText'])) { //offline
        $rootScope['status'] = {'offline': true};
      } else {
        alert(error.errorMessage);
      }
      deferred.reject(error);
    }

    function finallyCallback() {
      self.startStopSpinner();
    }


    if (classMethod != '_getFile') {
      /*if (lang !== undefined) {
        parameters['idLanguage'] = lang;
      }*/

      if (classMethod) {
        parameters['ajaxCall'] = classMethod;
      }

      //parameters['idSite'] = 1;

      $http.post(postUrl, parameters, httpConfig)
        .then(successCallBack, errorCallBack)
        .finally (finallyCallback);
    } else {
      var url = ($isLocalHost && parameters.path.indexOf('.jpg') > 0) //for webpack serving blob requests
          ? ajaxURL + '?path=' + encodeURI(parameters.path.replace('https', 'http'))
          : parameters.path;

      $http({
        'method': 'GET',
        'url': url,
        'data': {onprogress: parameters.onProgress},
        'responseType': parameters.type,
        'transformResponse': function(result) {
          return result;
        },
        'transformRequest': function(data) {
          return data;
        }
      })
        .then(successFileCallback, errorCallBack)
        .finally (finallyCallback);
    }

    return deferred.promise;

  }

}).inject('$rootScope', '$http', '$q', 'SpinnerService', 'isLocalHost');
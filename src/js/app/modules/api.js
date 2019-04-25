import angular from "angular";
import "./Spinner";
import HttpService from "./api/HttpService";
import ApiService from "./api/ApiService";

export default angular.module('api', ['angularSpinner'])
  .service(HttpService.displayName, HttpService)
  .service(ApiService.displayName, ApiService)
  .config(['$provide', function($provide) {
      $provide.decorator('$httpBackend', ['$delegate', function($delegate) {
        var proxy = function(method, url, post, callback, headers, timeout, withCredentials, responseType) {
          if (responseType !== 'blob' && responseType !== 'arraybuffer') {
            $delegate(method, url, post, callback, headers, timeout, withCredentials, responseType);
            return;
          }

          var xhr = new window.XMLHttpRequest();

          function requestError() {
            // The response is always empty
            // See https://xhr.spec.whatwg.org/#request-error-steps and https://fetch.spec.whatwg.org/#concept-network-error
            callback(-1, null, null, '');
          };

          xhr.open(method, url, true);
          angular.forEach(headers, function(value, key) {
            if (angular.isDefined(value)) {
              xhr.setRequestHeader(key, value);
            }
          });

          xhr.onload = function requestLoaded() {
            var statusText = xhr['statusText'] || '',
                // responseText is the old-school way of retrieving response (supported by IE9)
                // response/responseType properties were introduced in XHR Level2 spec (supported by IE10)
                response = ('response' in xhr) ? xhr['response'] : xhr['responseText'],
                status = xhr['status'];


            // fix status code when it is 0 (0 status is undocumented).
            // Occurs when accessing file resources or on Android 4.1 stock browser
            // while retrieving files from application cache.
            if (status === 0) {
              status = response ? 200 : 404;
            }

            callback(status, response, xhr.getAllResponseHeaders(), statusText);
          };

          xhr.onerror = requestError;
          xhr.onabort = requestError;

          if (post.onprogress) {
            xhr.onprogress = post.onprogress;
          }

          if (withCredentials) {
            xhr.withCredentials = true;
          }

          if (responseType) {
            try {
              xhr.responseType = responseType;
            } catch (e) {
              // WebKit added support for the json responseType value on 09/03/2013
              // https://bugs.webkit.org/show_bug.cgi?id=73648. Versions of Safari prior to 7 are
              // known to throw when setting the value "json" as the response type. Other older
              // browsers implementing the responseType
              //
              // The json response type can be ignored if not supported, because JSON payloads are
              // parsed on the client-side regardless.
              if (responseType !== 'json') {
                throw e;
              }
            }
          }

          xhr.send(post);


        };
        for (var key in $delegate) {
          proxy[key] = $delegate[key];
        }
        return proxy;
        }]);
}]);

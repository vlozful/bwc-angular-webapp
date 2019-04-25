import AC from "../core/AngularClass";
import ApiService from "../modules/api/ApiService";
import SessionService from "../services/SessionService";
import MD5 from "../../lib/md5";


var $apiService, $sessionService, $q, $storageService, $rootScope;

function md5Credentials(credentials) {
  return MD5(credentials['email'].toLowerCase() + credentials['password']);
}

function onSuccess(credentials, deferred) {
  $sessionService.load()
      .then(function() {
          $storageService.setItem('credentials', md5Credentials(credentials))
              .then(function() {
                $storageService.setItem('session', {
                      'idUser': $sessionService['userID'],
                      'ssid': $sessionService['ssid'],
                      'idLanguage': $sessionService['languageID'],
                      'lastAccess': $sessionService['lastAccess']
                    })
                  .then(function() {
                      deferred.resolve($sessionService.ssid);
                    }, function(err) {
                      alert('Error saving session: offline mode will not work: ' + err);
                    });
              }, function(error) {
                alert('Error saving credentials: offline mode will not work: ' + error);
              });
      }, function(err) {
          alert('Error loading session: ' + err);
          deferred.reject(err);
      });
}

function onError(credentials, deferred, err) {
  var offline = $rootScope['status']['offline'];
  if (offline) {
    //check for credentials in db
    $storageService.getItem('credentials')
        .then(function(md5String) {
          if (md5String === md5Credentials(credentials)) {
            $storageService.getItem('session').then(
                function(storedSession) {
                  $sessionService.create(storedSession);
                  deferred.resolve($sessionService.ssid);
                }
            );
          } else {
            alert('Wrong credentials');
            deferred.reject();
          }
        }, function(error) {
            alert("DB error, can't read stored credentials: " + error);
            deferred.reject();
        });
  } else {
    console.log('Login error: ' + err);
    deferred.reject();
  }
}

export default AC.extend('AuthService', {
  constructor: function(_$ApiService, _$SessionService, _$q, _$storageService, _$rootScope) {
    $apiService = _$ApiService;
    $sessionService = _$SessionService;
    $storageService = _$storageService;
    $rootScope = _$rootScope;
    $q = _$q;
  },

  login: function(credentials) {
    var deferred = $q.defer();
    $apiService.login(credentials['email'], credentials['password'])
        .then(function() {
          onSuccess(credentials, deferred);
        }, function(err) {
            onError(credentials, deferred, err);
        });
    return deferred.promise;
  },

  register: function(regInfo) {
    var deferred = $q.defer();
    $apiService.register(regInfo['email'], regInfo['password'], regInfo['password1'], regInfo['country'], regInfo['idLanguage'])
        .then(function() {
            onSuccess(regInfo, deferred);
        }, function(error) {
          deferred.reject();
        });
    return deferred.promise;
  },

  wasLoggedIn: function() {
    return $storageService.getItem('credentials');
  },

  isLoggedIn: function() {
    var deferred = $q.defer();

    function checkSession() {
      if ($sessionService.ssid) {
        if ($sessionService.userID) {
          deferred.resolve(true);
        }
        else {
          //alert('ssid present, but userID is absent');
          console.error('ssid present, but userID is absent');
          deferred.reject($sessionService.ssid);
        }
      } else {
        $sessionService.load()
            .then(function() {
              if ($sessionService.userID)
                deferred.resolve(true);
              else {
                console.error('Session loaded, but userID is absent');
                deferred.reject(false);
              }
            }, function(error) {
              //alert('Error loading session');
              console.error('Error loading session');
              deferred.reject();
            });
      }
    }

    $storageService.getItem('credentials')
        .then(function(cr) {
          if (!cr) {
            console.log('No stored credentials');
            deferred.reject();
          } else {
            checkSession();
          }
        }, function(err) { //if something happens with storage
          alert('Storage service does not work: ' + err);
          console.error('Storage service does not work: ' + err);
          checkSession();
        });
    return deferred.promise;
  }
}).inject(ApiService.fullName, SessionService.fullName, '$q', '$localForage', '$rootScope');

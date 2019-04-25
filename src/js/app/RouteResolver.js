import ApiService from "./modules/api/ApiService";
import SessionService from "../app/services/SessionService";

var CACHEKEY = 'booqla',
    instantiated = false,
    $q,
    $apiService,
    $sessionService,
    $cache,
    $route;

function getDataDeferred(caller, apiCall, args) {
  var key = String(caller),
    deferred = $q.defer(),
    data = $cache.get(key);

  if (!data) {
    apiCall.apply(null, args)
        .then(function(data) {
            $cache.put(key, data);
            deferred.resolve(data);
            return data;
        },
        function(error) {
            deferred.reject(error);
        });
  } else {
    deferred.resolve(data);
  }
  return deferred.promise;
}

function findInArray(array, item_id) {
  var i = 0, result;
  for (; i < array.length; i++) {
    if (array[i]['id'] == item_id) {
      result = array[i];
      break;
    }
  }
  return result;
}

function getId() {
  return parseInt($route.current.params['id'], 10) || $route.current.params['id']
}

function getGenreList() {
  return getDataDeferred(getGenreList, $apiService.getGenresList, [$sessionService.languageID])
}

function getLanguageList() {
  return getDataDeferred(getLanguageList, $apiService.getBookLanguages)
}

function getGenreBooksList() {
  var deferred = $q.defer(),
    title_id = getId();

  getGenreList()
      .then(function(genres) {
          deferred.resolve(findInArray(genres, title_id)['title'])
      }, function(error) {
          deferred.reject(error)
      });

  return deferred.promise;
}

function getLanguageBooksList() {
  var deferred = $q.defer(),
    title_id = getId();

  getLanguageList()
      .then(function(languages) {
          deferred.resolve(findInArray(languages, title_id)['title'])
      }, function(error) {
          deferred.reject(error)
      });
  return deferred.promise;
}

function getCountriesList() {
  return $apiService.getCountries();
}

function createResolver(func) {

  function instantiate(_$q, _$route, _$cacheFactory, _$apiService, _$sessionService) {
    $q = _$q;
    $route = _$route;
    $cache = _$cacheFactory(CACHEKEY);
    $apiService = _$apiService;
    $sessionService = _$sessionService;
    instantiated = true;
  }

  function resolverFunc() {
    if (!instantiated) {
      instantiate.apply(null, arguments);
    }
    return func.call();
  }
  resolverFunc['$inject'] = ['$q', '$route', '$cacheFactory', ApiService.fullName, SessionService.fullName];
  return resolverFunc;
}

export default {
  GENRES: {'data': createResolver(getGenreList)},
  LANGUAGES: {'data': createResolver(getLanguageList)},
  GENREBOOKS: {'title': createResolver(getGenreBooksList)},
  LANGUAGEBOOKS: {'title': createResolver(getLanguageBooksList)},
  COUNTRIES: {'data': createResolver(getCountriesList)}
};

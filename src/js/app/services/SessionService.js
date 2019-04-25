import AC from "../core/AngularClass";
import ApiService from "../modules/api/ApiService";
import E from "../constants/Events";

var $apiService, $rootScope, settings;

export default AC.extend('SessionService', {

  userID: '',

  ssid: '',

  languageID: '',

  trial: '',

  'lastAccess': '',

  constructor: function(_$apiService, _$rootScope, _settings) {
    $apiService = _$apiService;
    $rootScope = _$rootScope;
    settings = _settings;
  },

  load: function() {
    var self = this;

    return $apiService.getSession()
      .then(function(data) {
            self.create(data);
            $rootScope.$emit(E.GOTSESSION);
            return data;
        }, function(error) {
            return error;
        });
  },

  update: function(ssid) {
    var self = this;

    return $apiService.changeSession(ssid)
        .then(function(data) {
            self.create(data);
            $rootScope.$emit(E.GOTSESSION);
            return data;
        }, function(error) {
            return error;
        });
},

  create: function(data) {
    var bwcSeconds = parseInt(data['bwcSecondsFromCreated'], 10);
    this.userID = data['idUser'];
    this.languageID = data['idLanguage'];
    this.ssid = data['ssid'];
    this.lastAccess = data['lastAccess'];
    $apiService.setSSID(this.ssid);
    $rootScope['status']['trial'] = this.trial = bwcSeconds ? (parseInt(data['bwcTrialPeriod'], 10) - bwcSeconds) > 0 : false;
  },

  reset: function() {
    this.userID = this.idLanguage = this.ssid = this.trial = '';
  }
}).inject(ApiService.fullName, '$rootScope', 'settings');

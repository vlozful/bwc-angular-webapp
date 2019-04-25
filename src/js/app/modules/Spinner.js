import angular from "angular";
import Spinner from "../../lib/Spinner";

export default angular.module('angularSpinner', [])
    .provider('SpinnerConfig', function() {
        var _config = {};
        return {
            'setDefaults': function(config) {
                _config = config || _config;
            },
            '$get': function() {
                return {
                    config: _config
                };
            }
        };
    })
    .factory('SpinnerService', ['$rootScope', function($rootScope) {
        return {
            'spin': function(key) {$rootScope.$broadcast('us-spinner:spin', key);},
            'stop': function(key) {$rootScope.$broadcast('us-spinner:stop', key);}
        };
    }])
    .directive('usSpinner', ['$window', 'SpinnerConfig', function($window, usSpinnerConfig) {
        return {
            scope: true,
            link: function(scope, element, attr) {
                var SpinnerConstructor = Spinner;
                scope.spinner = null;
                scope.key = angular.isDefined(attr['spinnerKey']) ? attr['spinnerKey'] : false;
                scope.startActive = angular.isDefined(attr['spinnerStartActive']) ? scope.$eval(attr['spinnerStartActive']) : scope.key ? false : true;

                function stopSpinner() {
                    if (scope.spinner) {
                        scope.spinner.stop();
                    }
                }

                scope.spin = function() {
                    if (scope.spinner) {
                        scope.spinner.spin(element[0]);
                    }
                };

                scope.stop = function() {
                    scope.startActive = false;
                    stopSpinner();
                };

                scope.$watch(attr['usSpinner'], function(options) {
                    stopSpinner();

                    options = options || {};
                    for (var property in usSpinnerConfig.config) {
                        if (options[property] === undefined) {
                            options[property] = usSpinnerConfig.config[property];
                        }
                    }

                    scope.spinner = new SpinnerConstructor(options);
                    if (!scope.key || scope.startActive) {
                        scope.spinner.spin(element[0]);
                    }
                }, true);

                scope.$on('us-spinner:spin', function(event, key) {
                    if (key === scope.key) {
                        scope.spin();
                    }
                });

                scope.$on('us-spinner:stop', function(event, key) {
                    if (key === scope.key) {
                        scope.stop();
                    }
                });

                scope.$on('$destroy', function() {
                    scope.stop();
                    scope.spinner = null;
                });
            }
        };
}]);

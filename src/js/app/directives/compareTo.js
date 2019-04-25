var directiveName = 'compareTo';

function compareTo() {
  return {
    'require': 'ngModel',
    'scope': {
      'otherModelValue': '=' + directiveName
    },
    link: function(scope, element, attributes, ngModel) {
      ngModel['$validators'][directiveName] = function(modelValue) {
        return modelValue == scope['otherModelValue'];
      };

      scope.$watch('otherModelValue', function() {
        ngModel.$validate();
      });
    }}}

compareTo.fullName = directiveName;
export default compareTo;

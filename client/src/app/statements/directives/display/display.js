angular.module('statements')

  .directive('statementDisplay', function () {
    return {
      "restrict": 'E',
      "scope": {
        "statement": '='
      },
      "templateUrl": '/app/statements/directives/display/display.template.html',
      "link": function (scope, element, attrs, ctrls) {
        scope.variant = attrs.variant;
        scope.rating = true;
        if (angular.isDefined(attrs.rating) && attrs.rating.toLowerCase() === 'false') {
          scope.rating = false;
        }
      }
    };
  });


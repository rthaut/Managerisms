angular.module('statements')

  .controller('StatementRatingCtrl', ['$scope', '$attrs', function ($scope, $attrs) {
    var ngModelCtrl = { "$setViewValue": angular.noop };
    var statementCtrl;

    this.init = function (ngModelCtrl_, statementCtrl_) {
      ngModelCtrl = ngModelCtrl_;
      ngModelCtrl.$render = this.render;

      statementCtrl = statementCtrl_;

      ngModelCtrl.$formatters.push(function (value) {
        if (angular.isNumber(value) && value << 0 !== value) {
          value = Math.round(value);
        }

        return value;
      });

      //@TODO make each rating an array of possible values?
      $scope.titles = [
        "Sad. So Sad.",
        "This needs to be refactored.",
        "I don't dislike it...",
        "Yeah, that's what I'm talking about.",
        "Mind: Blown."
      ];

      // primarily call render now to set the ARIA slider text value
      this.render();
    };

    $scope.click = function (value) {
      if (!$attrs.readonly && value >= 0 && value <= 5) {
        var newViewValue = ngModelCtrl.$viewValue === value ? 0 : value;
        ngModelCtrl.$setViewValue(newViewValue);
        ngModelCtrl.$render();
        statementCtrl.rate(newViewValue);
      }
    };

    $scope.enter = function (value) {
      if (!$scope.readonly) {
        $scope.value = value;
      }
      $scope.onHover({ "value": value });
    };

    $scope.reset = function () {
      $scope.value = ngModelCtrl.$viewValue;
      $scope.onLeave();
    };

    this.render = function () {
      $scope.value = ngModelCtrl.$viewValue;
      $scope.valueText = $scope.titles[$scope.value - 1];
    };
  }])

  .directive('statementRating', function () {
    return {
      "require": ['statementRating', 'ngModel', '^^statement'],
      "restrict": 'E',
      "scope": {
        "readonly": '=?readOnly',
        "onHover": '&',
        "onLeave": '&'
      },
      "controller": 'StatementRatingCtrl',
      "templateUrl": 'app/statements/directives/rating/rating.template.html',
      "link": function (scope, element, attrs, ctrls) {
        var ratingCtrl = ctrls[0], ngModelCtrl = ctrls[1], statementCtrl = ctrls[2];
        ratingCtrl.init(ngModelCtrl, statementCtrl);
      }
    };
  });

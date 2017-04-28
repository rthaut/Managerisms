angular.module('statements')

  .constant('config', {
    max: 5,
    stateOn: null,
    stateOff: null,
    enableReset: true,
    titles: ['one', 'two', 'three', 'four', 'five']
  })

  .controller('StatementRatingCtrl', ['$scope', '$attrs', 'config', function ($scope, $attrs, config) {
    let ngModelCtrl = { $setViewValue: angular.noop };
    const self = this;

    this.init = function (ngModelCtrl_) {
      ngModelCtrl = ngModelCtrl_;
      ngModelCtrl.$render = this.render;

      ngModelCtrl.$formatters.push(function (value) {
        if (angular.isNumber(value) && value << 0 !== value) {
          value = Math.round(value);
        }

        return value;
      });

      this.stateOn = angular.isDefined($attrs.stateOn) ? $scope.$parent.$eval($attrs.stateOn) : config.stateOn;
      this.stateOff = angular.isDefined($attrs.stateOff) ? $scope.$parent.$eval($attrs.stateOff) : config.stateOff;
      this.enableReset = angular.isDefined($attrs.enableReset) ? $scope.$parent.$eval($attrs.enableReset) : config.enableReset;
      const tmpTitles = angular.isDefined($attrs.titles) ? $scope.$parent.$eval($attrs.titles) : config.titles;
      this.titles = angular.isArray(tmpTitles) && tmpTitles.length > 0 ? tmpTitles : config.titles;

      const ratingStates = angular.isDefined($attrs.ratingStates) ?
        $scope.$parent.$eval($attrs.ratingStates) :
        new Array(angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : config.max);
      $scope.range = this.buildTemplateObjects(ratingStates);
    };

    this.buildTemplateObjects = function (states) {
      for (let i = 0, n = states.length; i < n; i++) {
        states[i] = angular.extend({ index: i }, { stateOn: this.stateOn, stateOff: this.stateOff, title: this.getTitle(i) }, states[i]);
      }
      return states;
    };

    this.getTitle = function (index) {
      if (index >= this.titles.length) {
        return index + 1;
      }

      return this.titles[index];
    };

    $scope.rate = function (value) {
      if (!$scope.readonly && value >= 0 && value <= $scope.range.length) {
        const newViewValue = self.enableReset && ngModelCtrl.$viewValue === value ? 0 : value;
        ngModelCtrl.$setViewValue(newViewValue);
        ngModelCtrl.$render();
      }
    };

    $scope.enter = function (value) {
      if (!$scope.readonly) {
        $scope.value = value;
      }
      $scope.onHover({ value: value });
    };

    $scope.reset = function () {
      $scope.value = ngModelCtrl.$viewValue;
      $scope.onLeave();
    };

    this.render = function () {
      $scope.value = ngModelCtrl.$viewValue;
      $scope.title = self.getTitle($scope.value - 1);
    };
  }])

  .directive('statementRating', function () {
    return {
      require: ['statementRating', 'ngModel'],
      restrict: 'E',
      scope: {
        readonly: '=?readOnly',
        onHover: '&',
        onLeave: '&'
      },
      controller: 'StatementRatingCtrl',
      templateUrl: '/app/statements/directives/rating/rating.template.html',
      link: function (scope, element, attrs, ctrls) {
        const ratingCtrl = ctrls[0], ngModelCtrl = ctrls[1];
        ratingCtrl.init(ngModelCtrl);
      }
    };
  });

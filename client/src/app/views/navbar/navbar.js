angular.module('managerisms')

  .controller('NavbarCtrl', ['$scope', '$location', '$route', function ($scope, $location, $route) {

    $scope.locationEquals = function (navBarPath) {
      return $location.path() === navBarPath;
    };

    $scope.locationStartsWith = function (navBarPath) {
      return $location.path().startsWith(navBarPath);
    };

  }])

  .directive('navbar', function () {
    return {
      "restrict": 'A',
      "scope": {
        "statement": '='
      },
      "controller": 'NavbarCtrl',
      "templateUrl": '/app/views/navbar/navbar.template.html'
    };
  });


'use strict';

const app = angular.module('managerisms', [
  'ngAnimate',
  'ngRoute',
  'ui.bootstrap',
  'statements'
]);

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'app/home.template.html',
      controller: 'MainCtrl'
    })
    .otherwise({
      templateUrl: 'app/404.template.html',
      controller: 'MainCtrl'
    });

  $locationProvider.html5Mode(true);
});

app.controller('HeaderCtrl', ['$scope', '$location', '$route', function ($scope, $location, $route) {

  $scope.locationEquals = function (navBarPath) {
    return $location.path() === navBarPath;
  };

  $scope.locationStartsWith = function (navBarPath) {
    return $location.path().startsWith(navBarPath);
  };

}]);


app.controller('MainCtrl', ['$scope', '$location', '$route', function ($scope, $location, $route) {

  $scope.location = $location;
  $scope.route = $route;

}]);

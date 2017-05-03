angular.module('managerisms', [
  'angulartics',
  'angulartics.google.analytics',
  'ngAnimate',
  'ngRoute',
  'statements'
])

  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        "templateUrl": 'app/home.template.html',
        "controller": 'MainCtrl'
      })
      .otherwise({
        "templateUrl": 'app/404.template.html',
        "controller": 'MainCtrl'
      });

    $locationProvider.html5Mode(true);
  })

  .controller('MainCtrl', ['$scope', '$location', '$route', function ($scope, $location, $route) {

    $scope.location = $location;
    $scope.route = $route;

  }])

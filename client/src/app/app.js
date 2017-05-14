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
        "controller": 'HomeCtrl'
      })
      .otherwise({
        "templateUrl": 'app/404.template.html',
        "controller": '404Ctrl'
      });

    $locationProvider.html5Mode(true);
  })

  .controller('HomeCtrl', ['$scope', '$http', function ($scope, $http) {

    $http.get('/api/statements/random').then(function (data) {
      $scope.statement = data.data;
    });

  }])

  .controller('404Ctrl', ['$scope', '$location', '$route', function ($scope, $location, $route) {

    $scope.location = $location;
    $scope.route = $route;

  }])

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
        'templateUrl': 'app/home.template.html',
        'controller': 'HomeCtrl'
      })
      .otherwise({
        'templateUrl': 'app/404.template.html',
        'controller': '404Ctrl'
      });

    $locationProvider.html5Mode(true);
  })

  .controller('HomeCtrl', ['$scope', '$http', 'meta', function ($scope, $http, meta) {

    meta({ 'title': 'Managerisms' });

    $http.get('/api/statements/random').then(function (data) {
      $scope.statement = data.data;
    });

  }])

  .controller('404Ctrl', ['$scope', '$location', '$route', 'meta', function ($scope, $location, $route, meta) {

    meta({ 'title': '404 | Managerisms' });

    $scope.location = $location;
    $scope.route = $route;

  }])

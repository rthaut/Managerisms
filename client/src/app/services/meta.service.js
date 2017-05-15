angular.module('managerisms')

  .factory('meta', ['$rootScope', function ($rootScope) {
    var defaults = {
      'title': 'Managerisms'
    };

    $rootScope.meta = defaults;

    return function (meta) {
      $rootScope.meta = angular.extend({}, defaults, meta);
    }
  }])

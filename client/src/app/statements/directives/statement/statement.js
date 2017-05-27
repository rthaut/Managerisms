angular.module('statements')

  .directive('statement', function () {
    return {
      "restrict": 'E',
      "scope": {
        "statement": '='
      },
      "templateUrl": 'app/statements/directives/statement/statement.template.html',
      "controller": ['$scope', '$http', function ($scope, $http) {
        $scope.rating = true;

        this.rate = function (rating) {

          $http.post('/api/statements/' + $scope.statement._id + '/ratings/',
            { 'rating': rating }
          ).then(function (response) {
            $scope.statement.rating = angular.extend($scope.statement.rating, response.data);
          });

        };
      }]
    };
  })

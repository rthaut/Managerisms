angular.module('statements', [])

  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/statements/browse/:sort?/:direction?/:offset?', {
        "templateUrl": 'app/statements/browse.template.html',
        "controller": 'StatementsBrowseCtrl'
      })
      .when('/statements/create', {
        "templateUrl": 'app/statements/create.template.html',
        "controller": 'StatementCreateCtrl'
      })
      .when('/statements/view/:statementId', {
        "templateUrl": 'app/statements/view.template.html',
        "controller": 'StatementViewCtrl'
      })
  }])

  .controller('StatementsBrowseCtrl', ['$scope', '$routeParams', '$http', 'meta', function ($scope, $routeParams, $http, meta) {

    meta({ 'title': 'Browse Managerisms | Managerisms' });

    var routeParams = angular.merge({ 'sort': 'score', 'direction': 'down', 'offset': 0 }, $routeParams);
    routeParams.offset = parseInt(routeParams.offset, 10);
    $scope.routeParams = routeParams;

    $http.get('/api/statements', { 'params': $routeParams }).then(function (data) {
      $scope.statements = data.data;
    }).catch(function (error) {
      if (error.data.errmsg) {
        $scope.error = error.data.errmsg;
      } else if (error.data) {
        $scope.error = error.data;
      } else {
        $scope.error = error;
      }
    });

  }])

  .controller('StatementCreateCtrl', ['$scope', '$http', '$location', 'meta', function ($scope, $http, $location, meta) {

    meta({ 'title': 'Compose a Managerism | Managerisms' });

    $scope.analyze = function () {
      $scope.analyzing = true;

      $scope.clearAnalysis();
      $scope.clearError();

      $http.post('/api/statements/analyze',
        { 'text': $scope.statement.text }
      ).then(function (response) {
        var analysis = response.data;

        $scope.statement.text = analysis.formatted;
        $scope.breakdown = analysis.breakdown;
        $scope.score = analysis.score;

        $scope.validation = {};
        $scope.validation.valid = analysis.validation.valid || false;
        $scope.validation.breakdown = analysis.breakdown.reduce(function (acc, val) { return acc && val.valid; }, true);
        $scope.validation.syntax = analysis.validation.syntax || false;
      }).catch(function (error) {
        if (error.data.errmsg) {
          $scope.error = error.data.errmsg;
        } else if (error.data) {
          $scope.error = error.data;
        } else {
          $scope.error = error;
        }
      }).finally(function () {
        $scope.analyzing = false;
      });

    };

    $scope.onChange = function () {
      $scope.clearAnalysis();
      $scope.clearError();
    };

    $scope.clearAnalysis = function () {
      delete $scope.breakdown
      delete $scope.score;
      delete $scope.validation;
    };

    $scope.clearError = function () {
      delete $scope.error;
    };

    $scope.submit = function () {
      $scope.submitting = true;

      $scope.clearError();

      $http.post('/api/statements/',
        { 'text': $scope.statement.text, 'author': $scope.statement.author, 'citation': $scope.statement.citation }
      ).then(function (response) {
        $scope.statement = response.data;
        $location.path('/statements/view/' + $scope.statement._id);
      }).catch(function (error) {
        if (error.data.code === 11000) {
          $scope.error = 'Someone has already claimed that statement.'
        } else {
          if (error.data.errmsg) {
            $scope.error = error.data.errmsg;
          } else if (error.data) {
            $scope.error = error.data;
          } else {
            $scope.error = error;
          }
        }
      }).finally(function () {
        $scope.submitting = false;
      });
    };

    $scope.onKeydown = function (evt) {
      if (evt.which === 13) {
        evt.preventDefault();
        evt.stopPropagation();
        $scope.analyze();
      }
    };

  }])

  .controller('StatementViewCtrl', ['$scope', '$routeParams', '$http', 'meta', function ($scope, $routeParams, $http, meta) {

    meta({ 'title': 'View a Managerism | Managerisms' });

    $http.get('/api/statements/' + $routeParams.statementId).then(function (response) {
      var statement = response.data;

      meta({
        'title': statement.text.trail(60) + ' | Managerisms',
        'twitter': {
          'card': 'summary',
          //'site': '@managerisms_bot',
          'title': 'This Managerism Scored ' + statement.score.points.awarded + ' Points and is Currently Rated ' + statement.rating.average + ' (out of 5)',
          'description': statement.text
        }
      });

      $scope.statement = statement;

      $scope.$watch('statement.rating.session', function (newRating, oldRating) {
        if (oldRating !== newRating) {
          $scope.rateStatement(newRating);
        }
      });

    }).catch(function (error) {
      if (error.data.errmsg) {
        $scope.error = error.data.errmsg;
      } else if (error.data) {
        $scope.error = error.data;
      } else {
        $scope.error = error;
      }
    });

    $scope.rateStatement = function (rating) {

      $http.post('/api/statements/' + $routeParams.statementId + '/ratings/',
        { 'rating': rating }
      ).then(function (response) {
        $scope.statement.rating = angular.extend($scope.statement.rating, response.data);
      }).catch(function (error) {
        if (error.data.errmsg) {
          $scope.error = error.data.errmsg;
        } else if (error.data) {
          $scope.error = error.data;
        } else {
          $scope.error = error;
        }
      });

    };

  }])

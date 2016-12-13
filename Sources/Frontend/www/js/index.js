/// <reference path="../../typings/index.d.ts" />
angular.module('app', ['ngRoute'])
    .config(['$routeProvider', function ($route) {
        $route
            .when('/', {
            templateUrl: 'view/index.html',
            controller: 'IndexCtrl'
        })
            .when('/view', {
            templateUrl: 'view/view.html',
            controller: 'ViewCtrl'
        })
            .otherwise({
            redirectTo: '/'
        });
    }]);

/// <reference path="../../../typings/index.d.ts" />

interface IViewScope extends angular.IScope {
    name: string;
}

class ViewCtrl {
    static $inject = ['$scope'];
    constructor(
        private _scope: IViewScope
    ) {
        _scope.name = 'World!';
    }
}

angular.module('app')
.controller('ViewCtrl', ViewCtrl);

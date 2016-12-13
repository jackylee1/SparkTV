/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../services/HttpService.ts" />

interface IIndexScope extends angular.IScope {
    time: string;
}

class IndexCtrl {
    static $inject = ['$scope', 'HttpService'];
    constructor(
        private _scope: IIndexScope,
        private _httpSvc: HttpService
    ) {
        _httpSvc.init('http://localhost:5000');
        _httpSvc.get('/time', {
            onSuccess: (c, d) => {
                _scope.time = <string>d;
            },
            onError: (c, d) => {
                _scope.time = new Date().toTimeString();
                console.log('Error: ' + d);
            }
        });
    }
}

angular.module('app')
    .controller('IndexCtrl', IndexCtrl);
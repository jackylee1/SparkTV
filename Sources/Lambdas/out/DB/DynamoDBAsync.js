"use strict";
const aws_sdk_1 = require('aws-sdk');
function composePromise(method, params) {
    return new Promise((resolve, reject) => method(params, (err, res) => {
        if (err)
            reject(err);
        else
            resolve(res);
    }));
}
class DynamoDBAsync {
    constructor() {
        this._db = new aws_sdk_1.DynamoDB.DocumentClient();
    }
    create(params) {
        return composePromise(this._db.put.bind(this._db), params);
    }
    get(params) {
        return composePromise(this._db.get.bind(this._db), params);
    }
    update(params) {
        return composePromise(this._db.update.bind(this._db), params);
    }
    delete(params) {
        return composePromise(this._db.delete.bind(this._db), params);
    }
    find(params) {
        return composePromise(this._db.scan.bind(this._db), params);
    }
}
exports.DynamoDBAsync = DynamoDBAsync;

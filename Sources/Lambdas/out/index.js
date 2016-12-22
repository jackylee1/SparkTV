"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const sha1 = require('sha1');
const DynamoDBManager_1 = require('./DB/DynamoDBManager');
const Validator_1 = require('./Validation/Validator');
const AddressValidation_1 = require('./Validation/AddressValidation');
const Helpers_1 = require('./Helpers/Helpers');
const Fields_1 = require('./DB/Fields');
const Neo4j_1 = require('./Helpers/Neo4j');
function asyncWrapper(method) {
    method();
}
function handler(event, context, callback) {
    let tableName = event.tableName;
    let dbManager = new DynamoDBManager_1.DynamoDBManager();
    switch (event.operation) {
        case 'create':
            for (let r of Fields_1.getFieldsToCheck(tableName)) {
                if (!Validator_1.validate(event.payload, r)) {
                    callback(Helpers_1.genLambdaError(400 /* BadRequest */, `${r} is not valid`));
                    return;
                }
            }
            if (tableName === 'addresses') {
                asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        callback(null, yield dbManager.create(tableName, yield AddressValidation_1.requestValidAddr(event.payload)));
                    }
                    catch (ex) {
                        callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                    }
                }));
            }
            else if (tableName === 'customers') {
                asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield Neo4j_1.queryCypher('CREATE (n:user { name: {name}, email: {email} })', {
                            name: Helpers_1.tryFind(event.payload, 'firstname', undefined) + ' ' + Helpers_1.tryFind(event.payload, 'lastname', undefined),
                            email: Helpers_1.tryFind(event.payload, 'email', undefined)
                        });
                        callback(null, yield dbManager.create(tableName, event.payload));
                    }
                    catch (ex) {
                        callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                    }
                }));
            }
            else if (tableName === 'comment') {
                let comment = Helpers_1.tryFind(event.payload, 'comment', undefined);
                if (comment === undefined) {
                    callback(Helpers_1.genLambdaError(400 /* BadRequest */, `Comment does not exist in request.`));
                    return;
                }
                event.payload['UUID'] = sha1(comment);
                asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield Neo4j_1.queryCypher('CREATE (c:comment { id: {id}, comment: {comment} })', {
                            id: event.payload['UUID'],
                            comment: comment
                        });
                        callback(null, yield dbManager.create(tableName, event.payload));
                    }
                    catch (ex) {
                        callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                    }
                }));
            }
            else {
                if (tableName !== 'property') {
                    let tb = Fields_1.getTraceback(tableName);
                    let v = Helpers_1.tryFind(event.payload, tb, undefined);
                    if (v === undefined) {
                        callback(Helpers_1.genLambdaError(400 /* BadRequest */, `${tb} does not exist in request.`));
                        return;
                    }
                    event.payload[`${tb}ID`] = sha1(v);
                }
                let name = Helpers_1.tryFind(event.payload, 'name', undefined);
                if (name === undefined) {
                    callback(Helpers_1.genLambdaError(400 /* BadRequest */, `Name does not exist in request.`));
                    return;
                }
                event.payload['UUID'] = sha1(name);
                asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (tableName === 'episode') {
                            yield Neo4j_1.queryCypher('CREATE (e:content { id: {id}, name: {name} })', {
                                id: event.payload['UUID'],
                                comment: name
                            });
                        }
                        callback(null, yield dbManager.create(tableName, event.payload));
                    }
                    catch (ex) {
                        callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                    }
                }));
            }
            break;
        case 'get':
            asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    callback(null, yield dbManager.get(tableName, event.payload));
                }
                catch (ex) {
                    callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                }
            }));
            break;
        case 'update':
            if (tableName === 'addresses') {
                callback(Helpers_1.genLambdaError(400 /* BadRequest */, 'Cannot update an address.'));
            }
            else {
                asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        callback(null, yield dbManager.update(tableName, event.payload));
                    }
                    catch (ex) {
                        callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                    }
                }));
            }
            break;
        case 'delete':
            asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    callback(null, yield dbManager.delete(tableName, event.payload));
                }
                catch (ex) {
                    callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                }
            }));
            break;
        case 'find':
            asyncWrapper(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    callback(null, yield dbManager.find(tableName, event.payload));
                }
                catch (ex) {
                    callback(Helpers_1.genLambdaError(400 /* BadRequest */, ex));
                }
            }));
            break;
        case 'echo':
            callback(null, event.payload);
            break;
        default:
            callback(Helpers_1.genLambdaError(400 /* BadRequest */, "Bad Request Path"));
            break;
    }
}
exports.handler = handler;

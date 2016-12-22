"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const DynamoDBAsync_1 = require('./DynamoDBAsync');
const Fields_1 = require('../DB/Fields');
const Helpers_1 = require('../Helpers/Helpers');
class DynamoDBManager {
    constructor() {
        this._db = new DynamoDBAsync_1.DynamoDBAsync();
    }
    create(tableName, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let k = Fields_1.getFields(tableName)[0];
            let v = Helpers_1.tryFind(payload, k, undefined);
            if (!v)
                throw `${k || 'Key'} does not exist in request.`;
            let key = {};
            key[k] = v;
            let r = yield this._db.get({
                TableName: tableName,
                Key: key
            });
            if (r && r.Item)
                throw `${v || 'Item'} already exists.`;
            let item = {};
            for (let e of Fields_1.getFields(tableName))
                item[e] = Helpers_1.tryFind(payload, e, undefined);
            return this._db.create({
                TableName: tableName,
                Item: item
            });
        });
    }
    get(tableName, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = Helpers_1.tryFind(payload, 'key', undefined);
            if (!key)
                throw `Key does not exist in request.`;
            let r = yield this._db.get({
                TableName: tableName,
                Key: key
            });
            if (!r || !r.Item)
                throw `${key[Object.keys(key)[0]] || 'Item'} does not exists.`;
            return r.Item;
        });
    }
    update(tableName, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let r = yield this.get(tableName, payload);
            let attributes = {};
            for (let e of Fields_1.getFields(tableName)) {
                let v = Helpers_1.tryFind(payload, e, undefined);
                if (v && r[e] !== v) {
                    attributes[e] = {
                        Action: "PUT",
                        Value: v
                    };
                }
            }
            return this._db.update({
                TableName: tableName,
                Key: Helpers_1.tryFind(payload, 'key', undefined),
                AttributeUpdates: attributes
            });
        });
    }
    delete(tableName, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.get(tableName, payload);
            return this._db.delete({
                TableName: tableName,
                Key: Helpers_1.tryFind(payload, 'key', undefined)
            });
        });
    }
    find(tableName, payload) {
        return this._db.find({
            TableName: tableName,
            FilterExpression: Helpers_1.tryFind(payload, 'expression', undefined),
            ExpressionAttributeValues: Helpers_1.tryFind(payload, 'values', undefined)
        });
    }
}
exports.DynamoDBManager = DynamoDBManager;

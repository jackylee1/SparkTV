import { DynamoDBAsync } from './DynamoDBAsync';
import { getFields } from '../DB/Fields';
import { IDBManager } from '../Interfaces/IDBManager';
import { tryFind } from '../Helpers/Helpers';

export class DynamoDBManager implements IDBManager {
    _db = new DynamoDBAsync();

    async create(tableName: string, payload: any): Promise<any> {
        let k = getFields(tableName)[0];
        let v = tryFind(payload, k, undefined);
        if (!v) throw `${k || 'Key'} does not exist in request.`;

        let key = {};
        key[k] = v;
        let r = await this._db.get({
            TableName: tableName,
            Key: key
        });
        if (r && r.Item) throw `${v || 'Item'} already exists.`;

        let item = {};
        for (let e of getFields(tableName))
            item[e] = tryFind(payload, e, undefined);

        return this._db.create({
            TableName: tableName,
            Item: item
        });
    }

    async get(tableName: string, payload: any): Promise<any> {
        let key = tryFind(payload, 'key', {});
        let r = await this._db.get({
            TableName: tableName,
            Key: key
        });
        if (!r || !r.Item) throw `${key[Object.keys(key)[0]] || 'Item'} does not exists.`;
        return r.Item;
    }

    async update(tableName: string, payload: any): Promise<any> {
        let r = await this.get(tableName, payload);

        let attributes = {};
        for (let e of getFields(tableName)) {
            let v = tryFind(payload, e, undefined);
            if (v && r[e] !== v) {
                attributes[e] = {
                    Action: "PUT",
                    Value: v
                };
            }
        }

        return this._db.update({
            TableName: tableName,
            Key: tryFind(payload, 'key', {}),
            AttributeUpdates: attributes
        });
    }

    async delete(tableName: string, payload: any): Promise<any> {
        await this.get(tableName, payload);

        return this._db.delete({
            TableName: tableName,
            Key: tryFind(payload, 'key', {})
        });
    }

    find(tableName: string, payload: any): Promise<any> {
        return this._db.find({
            TableName: tableName,
            FilterExpression: tryFind(payload, 'expression', undefined),
            ExpressionAttributeValues: tryFind(payload, 'values', undefined)
        });
    }
}
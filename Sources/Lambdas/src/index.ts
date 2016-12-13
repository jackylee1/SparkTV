import * as lambda from 'aws-lambda';
import * as request from 'request';
import { IDBManager } from './Interfaces/IDBManager';
import { DynamoDBManager } from './DB/DynamoDBManager';
import { validate } from './Validation/Validator';
import { requestValidAddr } from './Validation/AddressValidation';
import { genLambdaError, tryFind } from './Helpers/Helpers';
import { HttpCodes } from './Helpers/HttpCodes';
import { ISmartyStreetResponse } from './Interfaces/ISmartyStreetResponse';
import { getFields, getFieldsToCheck, customersTableName, addressesTableName } from './DB/Fields';

const dbManager: IDBManager = new DynamoDBManager();

async function tcWrapper(method: () => Promise<any>, callback: lambda.Callback): Promise<any> {
    try {
        callback(undefined, await method());
    } catch (err) {
        callback(genLambdaError(HttpCodes.BadRequest, err));
    }
}

async function createIfNotExist(tableName: string, payload: any, keyName: string) {
    let key = {};
    key[keyName] = tryFind(payload, keyName, undefined);
    try {
        await dbManager.get(tableName, { key: key });
    } catch (err) {
        await dbManager.create(tableName, payload);
    }
}

export function handler(event, context: lambda.Context, callback: lambda.Callback): void {
    let tableName = event.tableName;

    switch (event.operation) {
        // create address requires customer email
        // {key: {email: xxx}, street: xxx ...}

        // create customer
        // {email: xxx ...}
        case 'create':
            for (let r of getFieldsToCheck(tableName)) {
                if (!validate(event.payload, r)) {
                    callback(genLambdaError(HttpCodes.BadRequest, `${r} is not valid`));
                    return;
                }
            }

            if (tableName === addressesTableName) {
                tcWrapper(async () => {
                    let k = tryFind(event.payload, 'key', undefined);
                    let r = await dbManager.get(customersTableName, { key: k });
                    if (r.delivery_point_barcode) throw `${r.email} already have an address attached`;

                    let addr = await requestValidAddr(event.payload);
                    createIfNotExist(tableName, addr, 'delivery_point_barcode');
                    return dbManager.update(customersTableName, { key: tryFind(event.payload, 'key', undefined), values: { delivery_point_barcode: addr.delivery_point_barcode } })
                }, callback);
            } else {
                tcWrapper(() => dbManager.create(tableName, event.payload), callback);
            }
            break;

        // read requires key
        // {key: {...}}
        case 'read':
            tcWrapper(() => dbManager.get(tableName, event.payload), callback);
            break;

        // update address requires customer email
        // {key: {email: xxx}, values: {xxx}}

        // update customer
        // {key: {email: xxx}, values: {xxx}}
        case 'update':
            if (tableName === addressesTableName) {
                tcWrapper(async () => {
                    let k = tryFind(event.payload, 'key', undefined);
                    let r = await dbManager.get(customersTableName, { key: k });
                    r = await dbManager.get(addressesTableName, { key: { delivery_point_barcode: r.delivery_point_barcode } });

                    let values = tryFind(event.payload, 'values', {});
                    for (let k of getFields(tableName)) {
                        if (values[k] && values[k] !== r[k]) {
                            r[k] = values[k];
                        }
                    }

                    let addr = await requestValidAddr(r);
                    createIfNotExist(tableName, addr, 'delivery_point_barcode');

                    return dbManager.update(customersTableName, { key: k, values: { delivery_point_barcode: addr.delivery_point_barcode } });
                }, callback);
            } else {
                tcWrapper(() => dbManager.update(tableName, event.payload), callback);
            }
            break;

        // delete requires key
        // {key: {xxx}}
        case 'delete':
            tcWrapper(() => dbManager.delete(tableName, event.payload), callback);
            break;

        // find requires expression and values
        // {expression: xxx, values: {xxx}}
        case 'find':
            tcWrapper(() => dbManager.find(tableName, event.payload), callback);
            break;

        // get address requires customer email
        // {key: {email: xxx}}
        case 'getaddr':
            tcWrapper(async () => {
                let k = tryFind(event.payload, 'key', undefined);
                let r = await dbManager.get(customersTableName, { key: k });
                return dbManager.get(addressesTableName, { key: { delivery_point_barcode: r.delivery_point_barcode } });
            }, callback);
            break;

        default:
            callback(genLambdaError(HttpCodes.BadRequest, "Bad Request Path"));
            break;
    }
}

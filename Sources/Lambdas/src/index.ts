import * as lambda from 'aws-lambda';
import * as request from 'request-promise';
import * as sha1 from 'sha1';
import { IDBManager } from './Interfaces/IDBManager';
import { DynamoDBManager } from './DB/DynamoDBManager';
import { validate } from './Validation/Validator';
import { requestValidAddr } from './Validation/AddressValidation';
import { genLambdaError, tryFind } from './Helpers/Helpers';
import { HttpCodes } from './Interfaces/HttpCodes';
import { ISmartyStreetResponse } from './Interfaces/ISmartyStreetResponse';
import { getFields, getFieldsToCheck, getTraceback } from './DB/Fields';
import { queryCypher } from './Helpers/Neo4j';

function asyncWrapper(method: () => void): void {
    method();
}

export function handler(event, context: lambda.Context, callback: lambda.Callback): void {
    let tableName = event.tableName;
    let dbManager: IDBManager = new DynamoDBManager();

    switch (event.operation) {
        case 'create':
            for (let r of getFieldsToCheck(tableName)) {
                if (!validate(event.payload, r)) {
                    callback(genLambdaError(HttpCodes.BadRequest, `${r} is not valid`));
                    return;
                }
            }

            if (tableName === 'addresses') {
                asyncWrapper(async () => {
                    try {
                        callback(null, await dbManager.create(tableName, await requestValidAddr(event.payload)));
                    } catch (ex) {
                        callback(genLambdaError(HttpCodes.BadRequest, ex));
                    }
                });
            } else if (tableName === 'customers') {
                asyncWrapper(async () => {
                    try {
                        await queryCypher('CREATE (n:user { name: {name}, email: {email} })',
                            {
                                name: tryFind(event.payload, 'firstname', undefined) + ' ' + tryFind(event.payload, 'lastname', undefined),
                                email: tryFind(event.payload, 'email', undefined)
                            });
                        callback(null, await dbManager.create(tableName, event.payload));
                    } catch (ex) {
                        callback(genLambdaError(HttpCodes.BadRequest, ex));
                    }
                });
            } else if (tableName === 'comment') {
                let comment = tryFind(event.payload, 'comment', undefined);
                if (comment === undefined) {
                    callback(genLambdaError(HttpCodes.BadRequest, `Comment does not exist in request.`));
                    return;
                }

                event.payload['UUID'] = sha1(comment);
                asyncWrapper(async () => {
                    try {
                        await queryCypher('CREATE (c:comment { id: {id}, comment: {comment} })',
                            {
                                id: event.payload['UUID'],
                                comment: comment
                            });
                        callback(null, await dbManager.create(tableName, event.payload));
                    } catch (ex) {
                        callback(genLambdaError(HttpCodes.BadRequest, ex));
                    }
                });
            } else {
                if (tableName !== 'property') {
                    let tb = getTraceback(tableName);
                    let v = tryFind(event.payload, tb, undefined);
                    if (v === undefined) {
                        callback(genLambdaError(HttpCodes.BadRequest, `${tb} does not exist in request.`));
                        return;
                    }

                    event.payload[`${tb}ID`] = sha1(v);
                }

                let name = tryFind(event.payload, 'name', undefined);
                if (name === undefined) {
                    callback(genLambdaError(HttpCodes.BadRequest, `Name does not exist in request.`));
                    return;
                }

                event.payload['UUID'] = sha1(name);
                asyncWrapper(async () => {
                    try {
                        if (tableName === 'episode') {
                            await queryCypher('CREATE (e:content { id: {id}, name: {name} })',
                                {
                                    id: event.payload['UUID'],
                                    comment: name
                                });
                        }
                        callback(null, await dbManager.create(tableName, event.payload));
                    } catch (ex) {
                        callback(genLambdaError(HttpCodes.BadRequest, ex));
                    }
                });
            }
            break;

        case 'get':
            asyncWrapper(async () => {
                try {
                    callback(null, await dbManager.get(tableName, event.payload));
                } catch (ex) {
                    callback(genLambdaError(HttpCodes.BadRequest, ex));
                }
            });
            break;

        case 'update':
            if (tableName === 'addresses') {
                callback(genLambdaError(HttpCodes.BadRequest, 'Cannot update an address.'));
            } else {
                asyncWrapper(async () => {
                    try {
                        callback(null, await dbManager.update(tableName, event.payload));
                    } catch (ex) {
                        callback(genLambdaError(HttpCodes.BadRequest, ex));
                    }
                });
            }
            break;

        case 'delete':
            asyncWrapper(async () => {
                try {
                    callback(null, await dbManager.delete(tableName, event.payload));
                } catch (ex) {
                    callback(genLambdaError(HttpCodes.BadRequest, ex));
                }
            });
            break;

        case 'find':
            asyncWrapper(async () => {
                try {
                    callback(null, await dbManager.find(tableName, event.payload));
                } catch (ex) {
                    callback(genLambdaError(HttpCodes.BadRequest, ex));
                }
            });
            break;

        case 'echo':
            callback(null, event.payload);
            break;

        default:
            callback(genLambdaError(HttpCodes.BadRequest, "Bad Request Path"));
            break;
    }
}

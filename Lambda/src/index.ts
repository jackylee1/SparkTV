import * as AWS from 'aws-sdk';
import * as lambda from 'aws-lambda';
import * as request from 'request-promise';
import * as sha1 from 'sha1';
import { IDBManager } from './Interfaces/IDBManager';
import { DynamoDBManager } from './DB/DynamoDBManager';
import { validate } from './Validation/Validator';
import { requestValidAddr } from './Validation/AddressValidation';
import { genLambdaError, tryFind, publishSns } from './Helpers/Helpers';
import { HttpCodes } from './Interfaces/HttpCodes';
import { ISmartyStreetResponse } from './Interfaces/ISmartyStreetResponse';
import { getFields, getFieldsToCheck, getTraceback } from './DB/Fields';
import { queryCypher } from './Helpers/Neo4j';
import { snsFunctionName, snsArn } from './Statics';

const dbManager: IDBManager = new DynamoDBManager();

export async function handler(event: any, context: lambda.Context, callback: lambda.Callback): Promise<void> {
    let tableName = event.tableName;
    let operation = event.operation;

    try {
        await publishSns(`This just in! ${operation} ${tableName ? `on table ${tableName}` : ''} with payload ${JSON.stringify(event.payload)} -- Team Typer`, snsArn);

        switch (operation) {
            case 'create':
                for (let r of getFieldsToCheck(tableName)) {
                    if (!validate(event.payload, r)) {
                        throw `${r} is not valid`;
                    }
                }

                switch (tableName) {
                    case 'addresses':
                        let addr = await requestValidAddr(event.payload);

                        await dbManager.create(tableName, addr);
                        callback(null, addr);
                        break;

                    case 'customers':
                        await queryCypher('CREATE (n:user { name: {name}, email: {email} })',
                            {
                                name: tryFind(event.payload, 'firstname', undefined) + ' ' + tryFind(event.payload, 'lastname', undefined),
                                email: tryFind(event.payload, 'email', undefined)
                            });

                        await dbManager.create(tableName, event.payload);
                        callback(null, 'Customer created.');
                        break;

                    case 'comment':
                        let comment = tryFind(event.payload, 'comment', undefined);
                        if (comment === undefined) {
                            throw 'Comment does not exist in request.';
                        }

                        event.payload['UUID'] = sha1(comment);

                        if (tryFind(event.payload, 'contentInstance', undefined) === 'episode') {
                            await queryCypher('CREATE (c:comment { id: {id}, comment: {comment} })',
                                {
                                    id: event.payload['UUID'],
                                    comment: comment
                                });

                            await queryCypher('MATCH (a:user),( b:comment) WHERE a.email = {email} AND b.id = {uuid} CREATE (a)-[r:COMMENTED]->(b)',
                                {
                                    email: tryFind(event.payload, 'userID', undefined),
                                    uuid: event.payload['UUID']
                                });

                            await queryCypher('MATCH (a:comment),( b:content) WHERE a.id = {cuuid} AND b.id = {iuuid} CREATE (a)-[r:commentedUpon]->(b)',
                                {
                                    cuuid: event.payload['UUID'],
                                    iuuid: tryFind(event.payload, 'contentInstanceID', undefined)
                                });
                        }

                        await dbManager.create(tableName, event.payload);
                        callback(null, 'Comment created.');
                        break;

                    default:
                        if (tableName !== 'property') {
                            let tb = getTraceback(tableName);
                            let v = tryFind(event.payload, tb, undefined);
                            if (v === undefined) {
                                throw `${tb} does not exist in request.`;
                            }

                            event.payload[`${tb}ID`] = sha1(v);
                        }

                        let name = tryFind(event.payload, 'name', undefined);
                        if (name === undefined) {
                            throw 'Name does not exist in request.';
                        }

                        event.payload['UUID'] = sha1(name);
                        if (tableName === 'episode') {
                            await queryCypher('CREATE (e:content { id: {id}, name: {name} })',
                                {
                                    id: event.payload['UUID'],
                                    comment: name
                                });
                        }

                        await dbManager.create(tableName, event.payload);
                        callback(null, `${tableName} created.`);
                        break;
                }

            case 'get':
                callback(null, await dbManager.get(tableName, event.payload));
                break;

            case 'update':
                if (tableName === 'addresses') {
                    throw 'Cannot update addresses.';
                } else {
                    await dbManager.update(tableName, event.payload);
                    callback(null, `${tableName} updated.`);
                }
                break;

            case 'delete':
                await dbManager.delete(tableName, event.payload);
                callback(null, `${tableName} deleted.`);
                break;

            case 'find':
                callback(null, await dbManager.find(tableName, event.payload));
                break;

            case 'echo':
                callback(null, event.payload);
                break;

            default:
                callback(genLambdaError(HttpCodes.BadRequest, 'Bad Request Path'), null);
                break;
        }
    } catch (ex) {
        callback(genLambdaError(HttpCodes.BadRequest, ex), null);
    }
}

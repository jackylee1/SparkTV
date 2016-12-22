import * as request from 'request-promise';
import { Neo4jUrl } from '../Statics';

export async function queryCypher(query: string, params: any): Promise<any> {
    let res = await request.post({
        uri: Neo4jUrl,
        json: { statements: [{ statement: query, parameters: params }] }
    });
    return res;
}
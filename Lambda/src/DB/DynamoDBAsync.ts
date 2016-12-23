import { DynamoDB } from 'aws-sdk';

function composePromise(method: (params: any, callback: (err, res) => void) => void, params: any): Promise<any> {
    return new Promise<any>((resolve, reject) =>
        method(params, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        })
    );
}

export class DynamoDBAsync {
    _db = new DynamoDB.DocumentClient();

    create(params: any): Promise<any> {
        return composePromise(this._db.put.bind(this._db), params);
    }

    get(params: any): Promise<any> {
        return composePromise(this._db.get.bind(this._db), params);
    }

    update(params: any): Promise<any> {
        return composePromise(this._db.update.bind(this._db), params);
    }

    delete(params: any): Promise<any> {
        return composePromise(this._db.delete.bind(this._db), params);
    }

    find(params: any): Promise<any> {
        return composePromise(this._db.scan.bind(this._db), params);
    }
}
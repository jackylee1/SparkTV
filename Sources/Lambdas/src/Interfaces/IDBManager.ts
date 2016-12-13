export interface IDBManager {
    create(tableName: string, payload: any): Promise<any>;
    get(tableName: string, payload: any): Promise<any>;
    update(tableName: string, payload: any): Promise<any>;
    delete(tableName: string, payload: any): Promise<any>;
    find(tableName: string, payload: any): Promise<any>;
}
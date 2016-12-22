export function tryFind(payload: any, key: string, def: any): any {
    if (payload) {
        if (payload[key]) {
            return payload[key];
        } else if (payload.payload && payload.payload[key]) {
            return payload.payload[key];
        } else if (payload.item && payload.item[key]) {
            return payload.item[key];
        } else if (payload.values && payload.values[key]) {
            return payload.values[key];
        }
    }
    return def;
}

export function genLambdaError(code: number, message: string) {
    return new Error(JSON.stringify({ code: code, message: message }));
}

const customersFields = ['email', 'firstname', 'lastname', 'phonenumber', 'delivery_point_barcode'];
const addressesFields = ['delivery_point_barcode', 'city', 'street', 'num', 'zipcode'];

// contentInstance is the type from ContentInstances
const commentFields = ['UUID', 'comment', 'contentInstance', 'contentInstanceID', 'userID'];

const propertyFields = ['UUID', 'name'];
const franchiseFields = ['UUID', 'name', 'propertyID'];
const seriesFields = ['UUID', 'name', 'franchiseID'];
const episodeFields = ['UUID', 'name', 'seriesID'];

const customersChecks = ['email', 'phonenumber'];
const addressesChecks = ['zipcode'];

const franchiseTraceback = 'property';
const seriesTraceback = 'franchise';
const episodeTraceback = 'series';

export function getFields(tableName: string): string[] {
    try {
        return eval(`${tableName}Fields`);
    } catch (ex) {
        return [];
    }
}

export function getFieldsToCheck(tableName: string): string[] {
    try {
        return eval(`${tableName}Checks`);
    } catch (ex) {
        return [];
    }
}

export function getTraceback(tableName: string): string {
    try {
        return eval(`${tableName}Traceback`);
    } catch (ex) {
        return undefined;
    }
}

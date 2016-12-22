import * as request from 'request-promise';
import { ISmartyStreetResponse } from '../Interfaces/ISmartyStreetResponse';
import { tryFind } from '../Helpers/Helpers';
import * as statics from '../Statics';

export async function requestValidAddr(payload: any): Promise<ISmartyStreetResponse> {
    let city = tryFind(payload, 'city', '');
    let street = tryFind(payload, 'street', '');
    let num = tryFind(payload, 'num', '');
    let zipcode = tryFind(payload, 'zipcode', '');

    let url = statics.SmartyStreetUrl + statics.SS_StreetPrefix + encodeURIComponent(`${street} ${num}`)
        + statics.SS_CityPrefix + encodeURIComponent(city)
        + statics.SS_ZipCodePrefix + encodeURIComponent(zipcode);

    let r = await request.get(url);

    let suggestions = JSON.parse(r);
    if (suggestions.length === 0) throw 'Invalid Address.';
    else if (suggestions.length > 1) throw 'Incomplete Address.';
    else {
        let sug = suggestions[0];
        return {
            delivery_point_barcode: sug.delivery_point_barcode,
            city: sug.components.city_name || '',
            street: `${sug.components.primary_number || ''} ${sug.components.street_predirection || ''} ${sug.components.street_name || ''} ${sug.components.street_postdirection || ''} ${sug.components.street_suffix || ''}`,
            num: `${sug.components.secondary_designator || ''} ${sug.components.secondary_number || ''}`,
            zipcode: sug.components.zipcode || ''
        };
    }
}

import * as keys from './Keys';

export const SmartyStreetUrl = `https://us-street.api.smartystreets.com/street-address?auth-id=${keys.SS_AuthId}&auth-token=${keys.SS_AuthToken}`;
export const SS_StreetPrefix = '&street=';
export const SS_CityPrefix = '&city=';
export const SS_ZipCodePrefix = '&zipcode=';
"use strict";
const keys = require("./Keys");
exports.SmartyStreetUrl = `https://us-street.api.smartystreets.com/street-address?auth-id=${keys.SS_AuthId}&auth-token=${keys.SS_AuthToken}`;
exports.SS_StreetPrefix = '&street=';
exports.SS_CityPrefix = '&city=';
exports.SS_ZipCodePrefix = '&zipcode=';

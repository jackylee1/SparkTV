"use strict";
const keys = require('./Keys');
exports.SmartyStreetUrl = `https://us-street.api.smartystreets.com/street-address?auth-id=${keys.SS_AuthId}&auth-token=${keys.SS_AuthToken}`;
exports.SS_StreetPrefix = '&street=';
exports.SS_CityPrefix = '&city=';
exports.SS_ZipCodePrefix = '&zipcode=';
exports.Neo4jUrl = 'http://contentcatalog:mL1CSF2PKYTtPkGMdRnv@hobby-hhimaappojekgbkebdhlnhol.dbs.graphenedb.com:24789/db/data/transaction/commit';

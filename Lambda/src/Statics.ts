import * as keys from './Keys';

export const SmartyStreetUrl = `https://us-street.api.smartystreets.com/street-address?auth-id=${keys.SS_AuthId}&auth-token=${keys.SS_AuthToken}`;
export const SS_StreetPrefix = '&street=';
export const SS_CityPrefix = '&city=';
export const SS_ZipCodePrefix = '&zipcode=';

export const Neo4jUrl = 'http://contentcatalog:mL1CSF2PKYTtPkGMdRnv@hobby-hhimaappojekgbkebdhlnhol.dbs.graphenedb.com:24789/db/data/transaction/commit';

export const snsFunctionName = 'slack_sns';
export const snsArn = 'arn:aws:sns:us-east-1:722850008576:comsTopic';
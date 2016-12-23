"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const request = require("request-promise");
const Helpers_1 = require("../Helpers/Helpers");
const statics = require("../Statics");
function requestValidAddr(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        let city = Helpers_1.tryFind(payload, 'city', '');
        let street = Helpers_1.tryFind(payload, 'street', '');
        let num = Helpers_1.tryFind(payload, 'num', '');
        let zipcode = Helpers_1.tryFind(payload, 'zipcode', '');
        let url = statics.SmartyStreetUrl + statics.SS_StreetPrefix + encodeURIComponent(`${street} ${num}`)
            + statics.SS_CityPrefix + encodeURIComponent(city)
            + statics.SS_ZipCodePrefix + encodeURIComponent(zipcode);
        let r = yield request.get(url);
        let suggestions = JSON.parse(r);
        if (suggestions.length === 0)
            throw 'Invalid Address.';
        else if (suggestions.length > 1)
            throw 'Incomplete Address.';
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
    });
}
exports.requestValidAddr = requestValidAddr;

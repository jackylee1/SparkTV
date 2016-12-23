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
const Statics_1 = require("../Statics");
function queryCypher(query, params) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield request.post({
            uri: Statics_1.Neo4jUrl,
            json: { statements: [{ statement: query, parameters: params }] }
        });
        return res;
    });
}
exports.queryCypher = queryCypher;

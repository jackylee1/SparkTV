/*
note: 
yh2901 modified based on yh2901 and tw2568' lambda version with MZhoume's project1 lambda as base
incorporate dbAddressOperation
modified addressValidate
fixed:
1. effective email and zipcode validation
2. try catch case when smarty street has empty return/invalid address error
todo:
1. how to update addresses? create new entry for the new delivery_point_barcode and change address_ref in customers table if neccessary 
10/22/2016 10:13PM 
Lambda test
{
  "operation": "create",
  "tableName": "addresses",
  "payload": {
    "item": {
      "city": "new york",
      "num": "1F",
      "street" : "505 E 14th Street",
      "zipcode": "10009"
    }
  }
}
*/
"use strict";
/// <reference path="../typings/index.d.ts" />
var sdk = require('aws-sdk');
var customerKeys = ['email', 'firstname', 'lastname', 'phonenumber', 'address_ref'];
var addressKeys = ['delivery_point_barcode', 'city', 'street', 'num', 'zipcode'];
function getKeys(tableName) {
    if (tableName === 'customers') {
        return customerKeys;
    }
    else if (tableName === 'addresses') {
        return addressKeys;
    }
}
var DBManager = (function () {
    function DBManager(_db) {
        this._db = _db;
    }
    DBManager.prototype.create = function (tableName, item, callback) {
        var params = {
            TableName: tableName,
            Item: item
        };
        console.log("I am creating ", tableName, item);
        this._db.put(params, callback);
    };
    DBManager.prototype.read = function (tableName, payload, callback) {
        var params = {
            TableName: tableName,
            Key: payload.key
        };
        this._db.get(params, callback);
    };
    DBManager.prototype.update = function (tableName, payload, callback) {

        var _this = this;
        this._db.get({
            TableName: tableName,
            Key: payload.key
        }, function (err, res) {
            if (!res) {
                console.log("old value not found");
                return;
            }
            var r = res.Item;
            var attributes = {};
            getKeys(tableName).forEach(function (e) {
                if (payload.values[e] && r[e] !== payload.values[e]) {
                    attributes[e] = {
                        Action: "PUT",
                        Value: payload.values[e]
                    };
                }
            });
            var params = {
                TableName: tableName,
                Key: payload.key,
                AttributeUpdates: attributes
            };
            _this._db.update(params, callback);
        });
    };
    DBManager.prototype.delete = function (tableName, payload, callback) {
        var params = {
            TableName: tableName,
            Key: payload.key
        };
        this._db.delete(params, callback);
    };
    DBManager.prototype.find = function (tableName, payload, callback) {
        var params = {
            TableName: tableName,
            FilterExpression: payload.expression,
            ExpressionAttributeValues: payload.values
        };
        this._db.scan(params, callback);
    };
    return DBManager;
} ());
var Validator = {
    'email': function (email) {
        // TODO: add comment about this regex
        var regex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
        return regex.test(email);
    },
    'zipcode': function (zipcode) {
        // TODO: add comment about this regex
        var regex = /^\d{5}$/;
        return regex.test(zipcode);
    }
};
function validate(data, validatorName, callback) {
    if (data && Validator[validatorName](data)) {
        console.log("validated as ", true);
        return true;
    } else {

        console.log("can't validate: ", validatorName);
        return false;
    }
}
function tryFind(payload, key) {
    if (payload.item && payload.item[key]) {
        return payload.item[key];
    }
    else if (payload.values && payload.values[key]) {
        return payload.values[key];
    }
    return false;
}
/* 
 ** call from addressValidate, formate input field according to api call and do operation on db (1. create, 2. update)
 **  @parsed: api return json object
 **  @operation: "create" | "update"
 */
function dbAddressOperation(parsed, event, db, callback, operation) {
    var item_3 = {};
    var payload_3 = event.payload.item;
    getKeys("addresses").forEach(function (e) {
        if (operation === "update" && payload_3[e] === undefined) {
            return;
        }
        if (e === "delivery_point_barcode") {
            item_3[e] = parsed[0].delivery_point_barcode;
        } else if (e === "city") {
            item_3[e] = parsed[0].components.city_name;
        } else if (e === "street") {
            var streetStr = "";
            if (parsed[0].components.primary_number !== undefined) {
                streetStr += (parsed[0].components.primary_number + " ");
            }
            if (parsed[0].components.street_predirection !== undefined) {
                streetStr += (parsed[0].components.street_predirection + " ");
            }
            streetStr += (parsed[0].components.street_name + " ");
            if (parsed[0].components.street_postdirection !== undefined) {
                streetStr += (parsed[0].components.street_postdirection + " ");
            }
            if (parsed[0].components.street_suffix !== undefined) {
                streetStr += (parsed[0].components.street_suffix + " ");
            }
            item_3[e] = streetStr;
        } else if (e === "num") {
            var secondaryNum = "";
            if (parsed[0].components.secondary_designator !== undefined) {
                secondaryNum += (parsed[0].components.secondary_designator + " ");
            }
            if (parsed[0].components.secondary_number !== 'undefined') {
                secondaryNum += parsed[0].components.secondary_number;
            }
            item_3[e] = secondaryNum;
        } else if (e === "zipcode") {
            item_3[e] = parsed[0].components.zipcode;
        }
    });
    if (operation === "create") {
        db.create("addresses", item_3, callback);
    } else if (operation === "update") {
        db.update("addresses", item_3, callback);
    }
}
function addressValidate(event, zipcode, callback, db, operation) {
    var httpRequestError = {
        code: "500",
        message: "Can't connect SmartyStreet"
    };
    var alreadyExistsError = {
        code: "400",
        message: "Key already exists!"
    };
    var keyNotFoundError = {
        code: "404",
        message: "the key you requested upon is not found! "
    };
    var InvalidAddressError = {
        code: "400",
        message: "the address entered is not valid! "
    };
    /****for db access****/
    var item_2 = {};
    var payload_2 = event.payload.item;
    /****for calling SmartyStreet****/
    var auth_id = 'b5b6289f-138b-825e-a95a-87574806cd23';
    var auth_token = '3tCVDM2HHvhzgArUth4O';
    var city = tryFind(event.payload, 'city');
    var street = tryFind(event.payload, 'street');
    var num = tryFind(event.payload, 'num');
    var http = require("https");
    var path_param = '/street-address?auth-id=' + auth_id + '&auth-token=' + auth_token;
    street = street + ' ' + num; //num is secondar_number 
    path_param += ('&street=' + encodeURIComponent(street));
    path_param += ('&city=' + encodeURIComponent(city));
    path_param += ('&zipcode=' + encodeURIComponent(zipcode));
    var options = {
        hostname: 'us-street.api.smartystreets.com',
        path: path_param,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; ; charset=utf-8'
        }
    };
    var req = http.request(options, function (res) {
        if (res.statusCode !== 200) {
            callback(JSON.stringify(internalServerError));
        } else {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function (d) {
                body += d;
            });
            res.on('end', function () {
                var parsed = JSON.parse(body);
                if (parsed[0] === undefined) { //parsed: [], SmartyStreet has suggestions
                    callback(JSON.stringify(InvalidAddressError));
                } else {
                    var barcodes = parsed[0].delivery_point_barcode;
                    if (barcodes) {
                        console.log("barcodes", barcodes);
                        db.read('addresses', {
                            "key": { "delivery_point_barcode": barcodes }
                        }, function (err, res) {
                            if (res.Item !== undefined) {
                                //address already exists
                                if (operation === 'create') {
                                    callback(JSON.stringify(alreadyExistsError));
                                } else if (operation === 'update') {
                                    dbAddressOperation(parsed, event, db, callback, "update");
                                }
                            } else { //the barcode does not exist in table yet
                                if (operation === 'create') {
                                    dbAddressOperation(parsed, event, db, callback, "create");
                                } else if (operation === 'update') {
                                    callback(JSON.stringify(keyNotFoundError));
                                }
                            }
                        }); //end of read addresses table
                    } else {
                        callback(JSON.stringify(barcodeNotFoundError));
                    }
                }
            }); //end of res.on 'end
        } //end of else res.statusCode === 2000

    }).on('error', function (err) {
        // handle errors with the request itself
        console.log("err: ", err);
        callback(JSON.stringify(httpRequestError));
    });
    req.end();
    console.log("requests end");
}

function handler(event, context, callback) {
    var internalServerError = {
        code: "500",
        message: "An unknown internal server error has occurred. Please try again."
    };
    var keyNotFoundError = {
        code: "404",
        message: "the key you requested is not found! "
    };
    var streetNotFoundError = {
        code: "400",
        message: "Please enter street name!"
    };
    var alreadyExistsError = {
        code: "400",
        message: "Key already exists!"
    };
    var barcodeNotFoundError = {
        code: "400",
        message: "can't recognize your address!"
    };
    var zipcodeInvalidError = {
        code: "400",
        message: "zipcode format invalid!"
    };
    var emailInvalidError = {
        code: "400",
        message: "email format invalid!"
    };
    var zipcodeMissingError = {
        code: "400",
        message: "missing zipcode from your input"
    };
    var cityMissingError = {
        code: "400",
        message: "missing city from your input"
    };
    var numMissingError = {
        code: "400",
        message: "missing num from your input"
    };
    var dynamo = new sdk.DynamoDB.DocumentClient();
    var db = new DBManager(dynamo);
    var tableName = event.tableName;
    var email = tryFind(event.payload, 'email');
    var zipcode = tryFind(event.payload, 'zipcode');
    //without if else, switch cases run through asynchronously,
    //switch will be executed before the validation callback
    if (email && !validate(email, 'email', callback)) {
        callback(JSON.stringify(emailInvalidError));
    } else if (zipcode && !validate(zipcode, 'zipcode', callback)) {
        callback(JSON.stringify(zipcodeInvalidError));
    } else {
        switch (event.operation) {
            case 'create':
                var item_1 = {};
                var payload_1 = event.payload.item;
                if (tableName == 'addresses') {
                    if (!tryFind(event.payload, "street")) {
                        console.log("I am not finding street info");
                        callback(JSON.stringify(streetNotFoundError));
                    } else if (!tryFind(event.payload, "zipcode")) {
                        callback(JSON.stringify(zipcodeMissingError));
                    } else if (!tryFind(event.payload, "city")) {
                        callback(JSON.stringify(cityMissingError));
                    } else if (!tryFind(event.payload, "num")) {
                        callback(JSON.stringify(numMissingError));
                    } else {
                        addressValidate(event, zipcode, callback, db, "create");
                    }
                } else { //tables other than addresses
                    getKeys(tableName).forEach(function (e) {
                        item_1[e] = payload_1[e];
                    });
                    db.create(tableName, item_1, callback);
                }
                break;
            case 'read':
                db.read(tableName, event.payload, callback);
                break;
            case 'update':
                db.read(tableName, event.payload, function (error, res) {
                    //console.log("res in update: ", res);
                    if (res.Item === undefined) {
                        callback(JSON.stringify(keyNotFoundError));
                    } else {
                        db.update(tableName, event.payload, callback);
                    }
                });
                if (tableName == 'addresses') {
                    var barcodes_update = addressValidate(event, zipcode, callback);
                    if (barcodes_update) {
                        db.update(tableName, event.payload, callback);
                    }
                    else {
                        callback(JSON.stringify(keyNotFoundError));
                    }
                }
                //db.update(tableName, event.payload, callback);
                break;
            case 'delete':
                db.delete(tableName, event.payload, callback);
                break;
            case 'find':
                db.find(tableName, event.payload, callback);
                break;
            case 'getaddr':
                db.read('customers', event.payload, function (err, res) {
                    if (res) {
                        var id = res.Item.address_ref;
                        db.read('addresses', {
                            "key": {
                                "delivery_point_barcode": id
                            }
                        }, callback);
                    }
                });
                break;
        }
    }
}
exports.handler = handler;

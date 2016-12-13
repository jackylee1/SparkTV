"use strict";
/// <reference path="../typings/index.d.ts" />
var sdk = require('aws-sdk');
var customerKeys = ['email', 'firstname', 'lastname', 'phonenumber', 'address_ref'];
var addressKeys = ['delivery_point_barcode', 'city', 'street', 'num', 'zipcode'];

function getKeys(tableName) {
    if (tableName === 'customers') {
        return customerKeys;
    } else if (tableName === 'addresses') {
        return addressKeys;
    }
}
var DBManager = (function() {
    function DBManager(_db) {
        this._db = _db;
    }
    DBManager.prototype.create = function(tableName, item, callback) {
        var params = {
            TableName: tableName,
            Item: item
        };
        console.log("I am creating in .create");
        this._db.put(params, callback);
    };
    DBManager.prototype.read = function(tableName, payload, callback) {
        var params = {
            TableName: tableName,
            Key: payload.key
        };
        this._db.get(params, callback);
    };
    DBManager.prototype.update = function(tableName, payload, callback) {
        var validationError = {
            code: "422",
            message: "value not found"
        };
        var _this = this;
        this._db.get({
            TableName: tableName,
            Key: payload.key
        }, function(err, res) {
            if (!res) {
                //callback("404,'Value not found'");
                callback(JSON.stringify(validationError));
                return;
            }
            var r = res.Item;
            var attributes = {};
            getKeys(tableName).forEach(function(e) {
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
        var params = {
            TableName: tableName,
            Key: payload.key
        };
        this._db.update(params, callback);
    };
    DBManager.prototype.delete = function(tableName, payload, callback) {
        var params = {
            TableName: tableName,
            Key: payload.key
        };
        this._db.delete(params, callback);
    };
    DBManager.prototype.find = function(tableName, payload, callback) {
        var params = {
            TableName: tableName,
            FilterExpression: payload.expression,
            ExpressionAttributeValues: payload.values
        };
        this._db.scan(params, callback);
    };
    return DBManager;
}());
var Validator = {
    'email': function(email) {
        // TODO: add comment about this regex
        var regex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
        return regex.test(email);
    },
    'zipcode': function(zipcode) {
        // TODO: add comment about this regex
        var regex = /^\d{5}$/;
        return regex.test(zipcode);
    }
};

function validate(data, validatorName, callback) {
    if (data && Validator[validatorName](data)) {
        return true;
    } else {
        var validationError = {
            "code": "422",
            "message": "value not found"
        };
        callback(JSON.stringify(validationError));
        return false;
    }
}

function tryFind(payload, key) {
    if (payload.item && payload.item[key]) {
        return payload.item[key];
    } else if (payload.values && payload.values[key]) {
        return payload.values[key];
    }
    return false;
}

/* call from addressValidate, formate input field according to api call and do operation on db (1. create, 2. update)
 **  @parsed: api return jason object
 **  @operation: "create" | "update"
 **
 */
function dbAddressOperation(parsed, event, db, callback, operation) {
    var item_1 = {};
    var payload_1 = event.payload.item;
    getKeys("addresses").forEach(function(e) {
        if (operation === "update" && payload_1[e] === undefined) {
            return;
        }
        if (e === "delivery_point_barcode") {
            item_1[e] = parsed[0].delivery_point_barcode;
        } else if (e === "city") {
            item_1[e] = parsed[0].components.city_name;
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
            item_1[e] = streetStr;
        } else if (e === "num") {
            var secondaryNum = "";
            if (parsed[0].components.secondary_designator !== undefined) {
                secondaryNum += (parsed[0].components.secondary_designator + " ");
            }
            if (parsed[0].components.secondary_number !== 'undefined') {
                secondaryNum += parsed[0].components.secondary_number;
            }
            item_1[e] = secondaryNum;
        } else if (e === "zipcode") {
            item_1[e] = parsed[0].components.zipcode;
        }
    });
    if (operation === "create") {
        db.create("addresses", item_1, callback);
    } else if (operation === "update") {
        db.update("addresses", item_1, callback);
    }
}

function addressValidate(event, zipcode, callback, db, operation) {
    var auth_id = '5b12379b-b37d-6f61-416b-4a8b8988ff22';
    var auth_token = '7RvhwEwj5a5SUhj4VpKw';
    var city = tryFind(event.payload, 'city');
    var street = tryFind(event.payload, 'street');
    var validationError = {
        code: "422",
        message: "value not found"
    };
    var updateError = {
        code: "NotFound",
        message: "Key Not Found! "
    };
    var alreadyExistsError = {
        code: "400",
        message: "Key already exists!"
    };
    var barcodeNotFoundError = {
        code: "400",
        message: "can't recognize your address!"
    };
    if (!street) {
        callback(JSON.stringify(validationError));
    }

    var num = tryFind(event.payload, 'num');
    var http = require("https");
    var path_param = "/street-address?auth-id=" + auth_id + "&auth-token=" + auth_token;
    if (num) {
        var secondary = num;
        path_param += ("&secondary=" + encodeURIComponent(secondary));
    }

    path_param += ("&street=" + encodeURIComponent(street));

    if (city) {
        path_param += ("&city=" + encodeURIComponent(city));
    }

    path_param += ('&zipcode=' + encodeURIComponent(zipcode));

    var options = {
        hostname: 'us-street.api.smartystreets.com',
        path: path_param,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; ;charset=utf-8'
        }
    };
    var req = http.request(options, function(res) {
        if (res.statusCode !== 200) {
            var validationError = {
                "code": res.statusCode,
                "message": "http response error"
            };
            callback(JSON.stringify(validationError));
        } else {
            res.setEncoding('utf8');
            var body = '';
            res.on('data', function(d) {
                body += d;
            });
            res.on('end', function() {
                try {
                    var parsed = JSON.parse(body);
                    var barcode = parsed[0].delivery_point_barcode;
                    if (barcode) {
                        console.log("barcodes", barcode);
                        db.read('addresses', {
                            "key": {
                                "delivery_point_barcode": barcode
                            }
                        }, function(err, res) {
                            //var item_1 = {};
                            //var payload_1 = event.payload.item;
                            console.log('read addresses res: ', res);
                            if (res.Item !== undefined) {
                                //address already exists
                                if (operation == "create") {
                                    callback(JSON.stringify(alreadyExistsError));
                                } else {
                                    // getKeys("addresses").forEach(function(e) {
                                    //     if (payload_1[e] !== undefined) {
                                    //         if (e === "city") {
                                    //             item_1[e] = parsed[0].components.city_name;
                                    //         }
                                    //     }
                                    // });
                                    //db.update("addresses", event.payload, callback);
                                    dbAddressOperation(parsed, event, db, callback, "update");
                                }
                            } else { //the barcode does not exist in table yet, add the entry!
                                //'delivery_point_barcode', 'city', 'street', 'num', 'zipcode'
                                // getKeys("addresses").forEach(function (e) {
                                //     if (e === "delivery_point_barcode") {
                                //         item_1[e] = barcode;
                                //     } else if (e === "city") {
                                //         item_1[e] = parsed[0].components.city_name;
                                //     } else if (e === "street") {
                                //         var streetStr = "";
                                //         if (parsed[0].components.primary_number !== undefined) {
                                //             streetStr += (parsed[0].components.primary_number + " ");
                                //         }
                                //         if (parsed[0].components.street_predirection !== undefined) {
                                //             streetStr += (parsed[0].components.street_predirection + " ");
                                //         }
                                //         streetStr += (parsed[0].components.street_name + " ");
                                //         if (parsed[0].components.street_postdirection !== undefined) {
                                //             streetStr += (parsed[0].components.street_postdirection + " ");
                                //         }
                                //         if (parsed[0].components.street_suffix !== undefined) {
                                //             streetStr += (parsed[0].components.street_suffix + " ");
                                //         }
                                //         item_1[e] = streetStr;
                                //     } else if (e === "num") {
                                //         var secondaryNum = "";
                                //         if (parsed[0].components.secondary_designator !== undefined) {
                                //             secondaryNum += (parsed[0].components.secondary_designator + " ");
                                //         }
                                //         if (parsed[0].components.secondary_number !== 'undefined') {
                                //             secondaryNum += parsed[0].components.secondary_number;
                                //         }
                                //         item_1[e] = secondaryNum;
                                //     } else if (e === "zipcode") {
                                //         item_1[e] = parsed[0].components.zipcode;
                                //     }
                                //     // if (e == "num") {
                                //     //     item_1[e] = parsed[0].secondary;
                                //     // } else {
                                //     //     item_1[e] = parsed[0][e];
                                //     // }
                                // });
                                // //item_1.delivery_point_barcode = barcode;
                                // db.create("addresses", item_1, callback);
                                if (operation === "create") {
                                    dbAddressOperation(parsed, event, db, callback, "create");
                                } else if (operation === "update") {
                                    callback(JSON.stringify(updateError));
                                }
                            }
                        }); //end of read addresses table
                    } else {
                        callback(JSON.stringify(barcodeNotFoundError));
                    }
                } catch (err) {
                    var jsonParseError = {
                        "code": "500",
                        "message": "Unable to parse response as JSON"
                    };
                    callback(JSON.stringify(jsonParseError));
                }
            });
        }
    }).on('error', function(err) {
        // handle errors with the request itself
        var httpReqError = {
            "code": "500",
            "message": "http request error"
        };
        callback(JSON.stringify(httpReqError));
    });
    req.end();
}

function handler(event, context, callback) {
    var dynamo = new sdk.DynamoDB.DocumentClient();
    var db = new DBManager(dynamo);
    var tableName = event.tableName;
    var email = tryFind(event.payload, 'email');
    var emailInvalidError = {
        code: "400",
        message: "email invalid!"
    };
    var zipcodeInvalidError = {
        code: "400",
        message: "zip code invalid!"
    };
    var updateError = {
        code: "NotFound",
        message: "Key Not Found! "
    };
    var addressValidationError = {
        code: "422",
        message: "Address not existed"
    };
    var badRequestError = {
        code: "400",
        message: "invalid request, key already exists"
    };
    if (email && !validate(email, 'email', callback)) {
        callback(JSON.stringify(emailInvalidError));
    }
    var zipcode = tryFind(event.payload, 'zipcode');
    if (zipcode && !validate(zipcode, 'zipcode', callback)) {
        callback(JSON.stringify(zipcodeInvalidError));
    }
    switch (event.operation) {
        case 'create':
            var item_1 = {};
            var payload_1 = event.payload.item;
            if (tableName == "addresses") {
                addressValidate(event, zipcode, callback, db, 'create');
                // if (reqbody_create) {
                //     db.read('addresses', {
                //         "key": { "Delivery_Point_Barcode": reqbody_create[0].delivery_point_barcode }
                //     }, function (err, res) {
                //         if (res) {
                //             //throw new HttpError(422, "Value is not valid");
                //             //callback(new Error(422, "Address: has already existed"));
                //             callback(JSON.stringify(badRequestError));
                //         } else {
                //             getKeys(tableName).forEach(function (e) {
                //                 if (e == "num") {
                //                     item_1[e] = reqbody_create[0]["secondary"];
                //                 } else {
                //                     item_1[e] = reqbody_create[0][e];
                //                 }
                //             });
                //         }
                //     });
                // }
            } else {
                getKeys(tableName).forEach(function(e) {
                    item_1[e] = payload_1[e];
                });
                db.create(tableName, item_1, callback);
            }
            break;
        case 'read':
            db.read(tableName, event.payload, callback);
            break;
        case 'update':
            if (tableName == 'addresses') {
                //var item_update = {};
                //var payload_update = event.payload.item;
                console.log("I am in update addresses");
                addressValidate(event, zipcode, callback, db, "update");
                // if (reqbody_update) {
                //     db.update(tableName, event.payload, callback);
                // }
                // else {
                //     callback(JSON.stringify( addressValidationError ));
                // }
            } else {
                db.read(tableName, event.payload, function(error, res) {
                    //console.log("res in update: ", res);
                    if (res.Item === undefined) {
                        callback(JSON.stringify(updateError));
                    }
                });
                db.update(tableName, event.payload, callback);
            }
            break;
        case 'delete':
            db.delete(tableName, event.payload, callback);
            break;
        case 'find':
            db.find(tableName, event.payload, callback);
            break;
        case 'getaddr':
            db.read('customers', event.payload, function(err, res) {
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
exports.handler = handler;

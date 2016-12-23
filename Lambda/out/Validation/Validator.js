"use strict";
const Helpers_1 = require("../Helpers/Helpers");
var Validator = {
    email: (email) => {
        // From: http://emailregex.com
        const regex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
        return regex.test(email);
    },
    zipcode: (zipcode) => {
        // Validate if the zipcode contains exactly 5 digits
        const regex = /^\d{5}$/;
        return regex.test(zipcode);
    },
    phonenumber: (number) => {
        // validate if the phone number contains only 10 digits
        const regex = /^\d{10}$/;
        return regex.test(number);
    }
};
function validate(payload, fieldName) {
    let data = Helpers_1.tryFind(payload, fieldName, undefined);
    return data && Validator[fieldName](data);
}
exports.validate = validate;

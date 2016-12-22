'use strict';
var request = require('request');

var slack_sns = 'https://hooks.slack.com/services/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';

var send_message = function(message, callback) {
    var data = {
        url: slack_sns,
        method: "POST",
        json: true,
        body: message
    };

    console.log("body = " + JSON.stringify(data.body));

    request(data, function(error, response, body){
        console.log("Status code = " + response.statusCode);
        callback(null, message);
    });
};

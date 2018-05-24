/**
 * Created by bk on 2017/3/8.
 */
exports.processRequest = function (request, response) {
    var qs = require('querystring');
    //var unescape = require('unescape');
    var unescapeJs = require('unescape-js');

    response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8','Access-Control-Allow-Origin':'*'});
    //console.log(qs.unescape("%u6D4B%u8BD5"));

    if (request.method.toUpperCase() == 'POST') {
        var postData = "";

        request.addListener("data", function (data) {
            postData += data;
        });

        request.addListener("end", function () {
            var query = qs.parse(postData);
            console.log(query);
            response.write(JSON.stringify({1:2}));
            response.end();
        });
    }
};
/**
 * Created by bk on 2017/3/8.
 */
exports.processRequest = function (request, response) {
    var qs = require('querystring');
    var url = require('url');

    response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8','Access-Control-Allow-Origin':'*'});
    if (request.method.toUpperCase() == 'GET') {
        var query =  qs.parse(url.parse(request.url).query);
        response.write(JSON.stringify(query));
        response.end();
    }
};
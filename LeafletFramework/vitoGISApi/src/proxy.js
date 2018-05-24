/**
 * Created by bk on 2016/11/2.
 */
exports.processRequest = function (request, response) {
    var http=require("http");
    var url = require('url');
    var querystring = require('querystring');
    var fs = require('fs');
    //console.log("转发请求。。。。");
    request.headers['accept-encoding'] = '';
    //console.log(request.headers);
    var opts={
        host:"192.168.0.80",//跨域访问的主机ip
        port:8080,
        path:"/geoserver/portalnet/ows",
        headers:request.headers,
        method:'POST'
    };
    var content = '';

    request.on("data",function(data){//接收参数 ------ request.on("data",function(data){});接收请求传递的参数
        var req = http.request(opts, function(res) {
            res.setEncoding('utf8');
            res.on('data',function(body){
                //console.log('return');
                content+=body;
            }).on("end", function () {
                //返回给前台
                if(res.headers != null&& res.headers['set-cookie'] != null){
                    //console.log("=======res.headers.cookie======="+res.headers.cookie);
                    response.writeHead(200, {
                        'Content-Type': 'text/plain;charset=utf-8',
                        'Set-Cookie': res.headers['set-cookie']
                    });//将cookie放到response中
                }
                else{
                    response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
                }
                response.write(content);
                response.end();
            });
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
        if(request.headers.cookie != null ){
            req.setHeader('Cookie',request.headers.cookie);
        }//获取request中的cookie</span>

        req.write(data+"\n");
        req.end();
    });

};

/**
 * Created by bk on 2017/3/10.
 */
exports.processRequest = function (request, response) {
    var qs = require('querystring');
    var url = require('url');
    var fs = require('fs');

    response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8','Access-Control-Allow-Origin':'*'});
    if (request.method.toUpperCase() == 'GET') {
        global.jsonData = {};
        var resJson = {};
        ////获取参数
        //var query =  qs.parse(url.parse(request.url).query);
        //读取json文件
        //var dataUrl = fs.readFileSync('framework/gis/conf/confTool/configuration/ConfUrl.json','utf8');
        var dataUrl = fs.readFileSync('vitoGISApi/bkvito/confTool/configuration/ConfUrl.json','utf8');
        dataUrl = JSON.parse(dataUrl);
        resJson.level = dataUrl.level;
        delete dataUrl.level;
        resJson.defaultIP = dataUrl.defaultIP;
        delete dataUrl.defaultIP;
        resJson.AreaChinese = dataUrl.area;
        delete dataUrl.area;
        resJson.fCRS = dataUrl.featureCRS;
        delete dataUrl.featureCRS;
        resJson.fNetSP = dataUrl.featureNetSP;
        delete dataUrl.featureNetSP;
        //var confUrl = dataUrl;

        // 循环confUrl，获取配置文件
        resJson.Area = {};
        for(var index in dataUrl) {
            global.jsonData[index] = {};

            resJson.Area[index] = [];
            var data = dataUrl[index];
            for(var k in data) {

                if(typeof data[k] === "object") {
                    resJson.Area[index].push(k);
                    global.jsonData[index][k] = {};
                    for(var n in data[k]) {

                        //var jsonData1 = JSON.parse(fs.readFileSync('framework/gis/conf/confTool' + data[k][n],'utf8'));
                        var jsonData1 = JSON.parse(fs.readFileSync('vitoGISApi/bkvito/confTool/' + data[k][n],'utf8'));
                        for(var i in jsonData1) {
                            global.jsonData[index][k][i] = jsonData1[i];
                        }
                    }
                } else {
                    //var jsonData2 = JSON.parse(fs.readFileSync('framework/gis/conf/confTool' + data[k],'utf8'));
                    var jsonData2 = JSON.parse(fs.readFileSync('vitoGISApi/bkvito/confTool/' + data[k],'utf8'));
                    for(var i in jsonData2) {
                        global.jsonData[index][i] = jsonData2[i];
                    }
                }
            }
        }
        //响应数据
        resJson.jsonData = global.jsonData;
        global.level = resJson.level;
        global.fCRS = resJson.fCRS;
        global.fNetSP = resJson.fNetSP;
        response.write(JSON.stringify(resJson));
        response.end();
    }
};
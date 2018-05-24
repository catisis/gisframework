/**
 * Created by bk on 2017/2/27.
 */
var writeOut = function (query, res) {
    res.write(JSON.stringify(query));
    res.end();
};
function insert(MapConf,query,response,vaildJson) {

    var curDate = new Date();
    var num = parseInt(Math.random()*90 + 10);//随机的两位数
    var id = curDate.getTime() + "" + parseInt(Math.random()*90 + 10);
    var user = new MapConf({
        _id: id,
        _class: "node",
        mapinit: JSON.stringify(vaildJson),
        createtime : curDate,
        createuser: "",
        maptitle: query.maptitle,
        isDefault: ""
    });

    user.save(function (err, res) {

        if (err) {
            //console.log("Error:" + err);
            console.log("Error:插入出错");
        }
        else {
            writeOut(query,response);
            //console.log("Res:" + res);
        }

    });
}

//更新数据的方法
function update(MapConf,query,response,vaildJson) {
    MapConf.findByIdAndUpdate(query.id, { $set: { mapinit: JSON.stringify(vaildJson) }}, function (err, conf) {
        if (err) {
            console.log("Error:更新函数出错");
        } else {
            writeOut(query,response);
        }
    });
}

//更新启动状态的方法
function updateDefault(MapConf,query) {
    MapConf.findByIdAndUpdate(query.id, { $set: { isDefault: '1' }}, function (err, conf) {
        if (err) {
            console.log("Error:更新状态函数出错");
        } else {
            //res.send(conf);
        }
    });
}

//生成最终数据
function getValidConf(query) {
    var vaildJson = {};
    var mapconfig = JSON.parse(query.mapconfig);
    //从global.jsonData中选出被勾选的选项
    for(var i = 0; i < mapconfig.length; i++) {
        if(mapconfig[i].length !=0) {
            var temp = mapconfig[i];
            if(temp.length === 3) {
                if(!vaildJson[temp[0]]) {
                    vaildJson[temp[0]] = {};
                }

                if(!vaildJson[temp[0]][temp[2]]) {
                    vaildJson[temp[0]][temp[2]] = {};
                }
                vaildJson[temp[0]][temp[2]] = global.jsonData[temp[0]][temp[1]][temp[2]];
            } else {
                if(!vaildJson[temp[0]]) {
                    vaildJson[temp[0]] = {};
                }

                if(!vaildJson[temp[0]][temp[1]]) {
                    vaildJson[temp[0]][temp[1]] = {};
                }
                vaildJson[temp[0]][temp[1]] = global.jsonData[temp[0]][temp[1]];
            }
        }
    }
    //    加上divConfing的数据
    vaildJson["divConfig"] = jsonData.divConfig;

    var mapUrlRe = /[a-zA-z]+:\/\/[^\s]*\:[0-9]+\//; //截取mapUrl
    var featureUrlRe = /\?[a-zA-z]+:\/\/[^\s]*\:[0-9]*/;
    var nameSpace = query.nameSpace;
    //替换底图IP
    for (var k in vaildJson.baseLayerConf){
        var mapUrl = vaildJson.baseLayerConf[k].mapUrl;
        var baseMatches = mapUrl.match(mapUrlRe);
        if(baseMatches) {
            var mapPath = mapUrl.split(mapUrlRe)[1];
            vaildJson.baseLayerConf[k].mapUrl = "http://" + query.baseLayerIP + '/' + mapPath;
        }
    }
    //替换图层IP，nameSpace，crs，netsp
    for(var m in vaildJson.featureLayersConf) {
        var featureUrl = vaildJson.featureLayersConf[m].url;
        var preNameSpace = "/" + vaildJson.featureLayersConf[m].nameSpace + "/";
        vaildJson.featureLayersConf[m].nameSpace = nameSpace;
        var featureMatches = featureUrl.match(featureUrlRe);
        if (featureMatches) {
            var featureUrlArray = featureUrl.split(featureUrlRe);
            var newStr = featureUrlArray[1].replace(preNameSpace, "/" + nameSpace + "/");
            vaildJson.featureLayersConf[m].url = featureUrlArray[0] + "?" + "http://" + query.featureLayersIP + newStr;
        }
        vaildJson.featureLayersConf[m].crs = global.fCRS[nameSpace];
        vaildJson.featureLayersConf[m].netSP = global.fNetSP[nameSpace];
        //修改图层的自动查询级别
        var level = global.level;
        for(var l in level[nameSpace]) {
            if(l == m) {
                vaildJson.featureLayersConf[l].minZoom = level[nameSpace][l].minZoom;
                vaildJson.featureLayersConf[l].defaultZoom = level[nameSpace][l].defaultZoom;
                vaildJson.featureLayersConf[l].maxZoom = level[nameSpace][l].maxZoom;
                if(level[nameSpace][l].auto == false) {
                    console.log(11);
                    vaildJson.featureLayersConf[l].auto = level[nameSpace][l].auto;
                }

                break;
            }
        }
    }
    return vaildJson;
}

exports.processRequest = function (request, response) {
    var qs = require('querystring');
    var MapConf = require("./mapConf.js");


    response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8','Access-Control-Allow-Origin':'*'});
    if (request.method.toUpperCase() == 'POST') {
        var postData = "";

        request.addListener("data", function (data) {
            postData += data;
        });

        request.addListener("end", function () {
            var query = qs.parse(postData);
            var vaildJson =  getValidConf(query);
            console.log(query);
            if(query.id != 0){
            	console.log("update");
            	update(MapConf,query,response,vaildJson);
            } else {
            console.log("insert");
            insert(MapConf,query,response,vaildJson);
            }
            //response.write(JSON.stringify(query));
            //response.end();
        });
    }
};

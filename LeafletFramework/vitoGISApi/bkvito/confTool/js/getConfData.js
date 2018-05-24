/**
 *
 */
//同步执行getJson，拿到所有配置文件的内容

function getConfData(url) {
    $.ajaxSettings.async = false;
    $.getJSON(url, function (dataUrl) {
        level = dataUrl.level;
        delete dataUrl.level;
    	defaultIP = dataUrl.defaultIP;
        delete dataUrl.defaultIP;
        AreaChinese = dataUrl.area;
        delete dataUrl.area;
        fCRS = dataUrl.featureCRS;
        delete dataUrl.featureCRS;
        fNetSP = dataUrl.featureNetSP;
        delete dataUrl.featureNetSP;
        window.confUrl = dataUrl;
    });
    $.each(confUrl, function (index, data) {
        window.jsonData[index] = {};
        Area[index] = [];
        for(var k in data) {

            if(typeof data[k] === "object") {
                Area[index].push(k);
                window.jsonData[index][k] = {};
                for(var n in data[k]) {

                    $.getJSON(data[k][n], function (jsonData) {
                        for(var i in jsonData) {
                            window.jsonData[index][k][i] = jsonData[i];
                        }
                    });
                }
            } else {
                $.getJSON(data[k], function (jsonData) {
                    for(var i in jsonData) {
                        window.jsonData[index][i] = jsonData[i];
                    }
                });
            }

        }
    });

    //给confType,confName赋值
    dataForShowHtml();
}





function dataForShowHtml(){
    var i = 0;
    for(var k in jsonData) { //(k包括baseLayerConf,featureLayersConf,widgetsConfig,divConfig)
        if(k !== "divConfig") {
            confType.title[i] = k;//给confType.title赋值
            confName[k] = [];
            for(var j in jsonData[k]) {
                    if(jsonData[k][j].title) {
                        var titleandname = [];
                        titleandname[0] = jsonData[k][j].title;
                        titleandname[1] = j;
                        confName[k].push(titleandname); //给confName.k赋值
                        description[j] = jsonData[k][j].description;
                        widgetsID[j] = jsonData[k][j].id;
                    }else {
                        for(var q in jsonData[k][j]) {
                            var titleandname = [];
                            titleandname[0] = jsonData[k][j][q].title;
                            titleandname[1] = j + "-" + q;
                            confName[k].push(titleandname); //给confName.k赋值
                            description[q] = jsonData[k][j][q].description;
                        }
                    }
            }
        }
        i++;
    }
}

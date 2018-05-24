/**
 *
 */
//确定按钮事件
function finalData(id) {
    $("#btnGoBack").on('click',function(){
        parent.formArea1.datagrid('reload');
        parent.page1.showView();
        //返回的时候将页面恢复到初始的状态
        $(":checkbox").prop("checked",true);
        $(":text").val("");
        updateID = 0;
    });

    $("#" + id).on("click", function () {

        getValidConf();

        if(openNewPage) {
        	if(updateID == 0){
        		//$('#myModal').modal();
                $.ajax({
                    type: "post",
                    url:  "/createZip",
                    data: {maptitle: "", mapconfig: JSON.stringify(validData),id: updateID},
                    dataType: "json",
                    beforeSend: function(request) {
                        request.setRequestHeader("Test", "Chenxizhang");
                    },
                    success: function(e) {
                        console.log(e);
                        //返回的时候将页面恢复到初始的状态
                        //$(":checkbox").prop("checked",true);
                        //$(":text").val("");
                        updateID = 0;
                        $("#downloadUrl").attr("href", e.downloadUrl);
                        document.getElementById("downloadUrl").click();
                        alert("JSON文件名" + e.name);


                        //测试代码，是否成功存入数据库
                        //console.log(e);
                        //alert("成功！！！");
                    },
                    error: function() {
                        alert("失败!");
                    }
                });
        	} else {
        		$.ajax({
                    type: "post",
                    url: ctx + "/sys/vitoconfig/initMapConfig.ht?",
                    data: {maptitle: maptitle, mapconfig: JSON.stringify(validData),id: updateID},
                    dataType: "json",
                    success: function() {
                        parent.formArea1.datagrid('reload'); //刷新
                        parent.page1.showView(); //显示列表所在页面
                        //返回的时候将页面恢复到初始的状态
                        $(":checkbox").prop("checked",true);
                        $(":text").val("");
                        updateID = 0;
                        alert("修改成功!");
                    },
                    error: function() {
                        alert("修改失败!");
                    }
                });
        	}
            
        } else{
            openNewPage = true;
        }

    });
}

$('#btnData').on('click', function () {
    var inputFileName = document.getElementById("fileName");
    var fileNameText = inputFileName.value;
    if(fileNameText === ''){
        alert('请填写文件名');
    } else {
        $.ajax({
            type: "post",
            url:  "/app/biz",
            data: {maptitle: fileNameText, mapconfig: JSON.stringify(validData),id: updateID},
            dataType: "json",
            success: function(e) {
                console.log(e);
                $('#myModal').modal('hide');
                inputFileName.value = "";
                //返回的时候将页面恢复到初始的状态
                $(":checkbox").prop("checked",true);
                $(":text").val("");
                updateID = 0;
                alert("成功!");
            },
            error: function() {
                alert("失败!");
            }
        });
    }
});

//设置要素自动查询的范围
function getLevelAndFeature(){
    var feature = [];
    for(var k in validData["featureLayersConf"]) {
        if(validData["featureLayersConf"][k].isShow && validData["featureLayersConf"][k].auto) {
            feature.push(k);
        }
    }
    if(feature.length > 0) {
    	var maxZoom = parseInt(validData.baseLayerConf.defaultLayer.maxZoom);
        var minZoom = parseInt(validData.baseLayerConf.defaultLayer.minZoom);
        var initLevel = parseInt(validData.baseLayerConf.defaultLayer.initLevel);
        setFeatureZoom(maxZoom,minZoom,initLevel,feature.reverse());
    }
}
function setFeatureZoom(baseMaxZoom,baseMinZoom,initLevel,feature) {
	var length = feature.length;
    var minZoom = baseMaxZoom + 1;
    var m = baseMaxZoom - baseMinZoom + 1;
    for(var i = 0; i < length; i++ ){
        var name = feature[i];
        var temp = Math.floor(m/length) + (m%length >  i ? 1 : 0);
    	if(minZoom <= baseMinZoom) {
            minZoom = baseMinZoom + 1;
        }
        validData["featureLayersConf"][name].maxZoom = minZoom;
        minZoom = minZoom - temp;
        if(minZoom <= baseMinZoom) {
            minZoom = baseMinZoom;
        }
        validData["featureLayersConf"][name].minZoom = minZoom;
        var zoom =validData["featureLayersConf"][name].maxZoom + validData["featureLayersConf"][name].minZoom;
        validData["featureLayersConf"][name].defaultZoom = Math.floor(zoom/2);
    }
}

//设置cookies的值
function setCookies() {
    //保存input的值到cookie
    var txtBaseLayerIP = $("#input-baseLayerConf")[0].value;
    var txtFeatureLayersIP = $("#input-featureLayersConf")[0].value;
    var txtIP = {"txtBaseLayerIP":txtBaseLayerIP,"txtFeatureLayersIP":txtFeatureLayersIP};
    SetCookie("txtIP",JSON.stringify(txtIP));

    //保存项目的cookie值
    var projectNum =  $("#select_area").get(0).selectedIndex;
    SetCookie("projectNum",projectNum);

    //保存baseLayers的cookie值
    var baseLayerNum = "";
   var $baseLayerChecked  = $("input[value*='baseLayerConf-']");
    $($baseLayerChecked).each(function (index, ele) {
        //console.log(ele.checked);
        baseLayerNum += ele.checked == true ? 1 : 0;
    });
    //console.log(baseLayerNum);
    SetCookie("baseLayerNum",baseLayerNum);

    //保存featureLayers的cookie值
    var featureLayerNum = "";
    var $featureLayerChecked  = $("input[value*='featureLayersConf-']");
    $($featureLayerChecked).each(function (index, ele) {
        //console.log(ele.checked);
        featureLayerNum += ele.checked == true ? 1 : 0;
    });
    //console.log(featureLayerNum);
    SetCookie("featureLayerNum",featureLayerNum);

    //保存widgets的cookie值
    var widgetsNum = "";
    var $widgetsChecked  = $("input[value*='widgetsConfig-']");
    $($widgetsChecked).each(function (index, ele) {
        //console.log(ele.checked);
        widgetsNum += ele.checked == true ? 1 : 0;
    });
    //console.log(widgetsNum);
    SetCookie("widgetsNum",widgetsNum);
}


//生成最终的数据
function getValidConf(){
    openNewPage = true;

    validData = {}; //
    //所有被选中的checkbox，将这些选中的配置文件的内容存放到validData
    var $checked = $("input[type='checkbox']:checked ");
    $($checked).each(function (index, element) {

        //不包括全选checkbox
        if(element.value !== "all"){
            var eleValue = element.value.split("-");

            if(eleValue.length === 3) {
                if(!validData[eleValue[0]]) {
                    validData[eleValue[0]] = {};
                }

                if(!validData[eleValue[0]][eleValue[2]]) {
                    validData[eleValue[0]][eleValue[2]] = {};
                }

                nameSpace = eleValue[1];

                validData[eleValue[0]][eleValue[2]] = jsonData[eleValue[0]][eleValue[1]][eleValue[2]];
            } else {
                if(!validData[eleValue[0]]) {
                    validData[eleValue[0]] = {};
                }

                if(!validData[eleValue[0]][eleValue[1]]) {
                    validData[eleValue[0]][eleValue[1]] = {};
                }

                validData[eleValue[0]][eleValue[1]] = jsonData[eleValue[0]][eleValue[1]];
            }

        }


    });


    //地图必须要选择
    for(var t = 0; t < confType.title.length; t++) {
        if(!validData[confType.title[t]] && confType.title[t] == "baseLayerConf") {
            alert("请配置" + confType.title[t]);
            openNewPage = false;
            return;
        }
    }


    setCookies();

//        加上divConfing的数据
    validData["divConfig"] = jsonData.divConfig;

    //getLevelAndFeature();
    //获取所有的type为text的input框
    var $inputText = $(":text");

    $($inputText).each(function (index, element) {

        var eleId = element.id.split("-");
        if(eleId[1] === "baseLayerConf") {
            if(element.value) {
                //判断input框的格式是否正确
                var reResualt = checkInputValue.test(element.value);
                if(!reResualt) {
                    $("#warning-baseLayerConf").removeClass("hidden")
                        .addClass("text-danger")
                        .html("格式错误! &nbsp&nbsp&nbsp&nbsp&nbsp  正确格式:&nbsp&nbsp192.168.0.191:8090")
                        .css("margin-left","20px").css("margin-top","5px");
                    openNewPage = false;
                    return;
                }else {
                    var $warning =$('#warning-baseLayerConf');
                    if(!$warning.is('.hidden')) {
                        $warning.addClass("hidden");
                    }
                }
                //input框中的地址代替配置文件中的地址
                for (var k in validData.baseLayerConf){
                    var mapUrl = validData.baseLayerConf[k].mapUrl;
                    var baseMatches = mapUrl.match(mapUrlRe);
                    if(baseMatches) {
                        var mapPath = mapUrl.split(mapUrlRe)[1];
                        validData.baseLayerConf[k].mapUrl = "http://" + element.value + '/' + mapPath;
                    }
                }
            } else {
                alert("请配置服务器地址!");
                openNewPage = false;
                return;
            }

        } else if (eleId[1] === "featureLayersConf" && openNewPage){ //openNewPage等于false就表示if中的地址已经有错所以下次循环到这边的时候不用再执行了
            if(element.value) {
                //判断input框的格式是否正确
                var reResualtF = checkInputValue.test(element.value);
                if(!reResualtF) {
                    $("#warning-featureLayersConf").removeClass("hidden")
                        .addClass("text-danger")
                        .html("格式错误! &nbsp&nbsp&nbsp&nbsp&nbsp  正确格式:&nbsp&nbsp192.168.0.191:8090")
                        .css("margin-left","20px").css("margin-top","5px");
                    openNewPage = false;
                    return;
                } else {
                    var $warning =$('#warning-featureLayersConf');
                    if(!$warning.is('.hidden')) {
                        $warning.addClass("hidden");
                    }
                }

                //input框中的地址代替配置文件中的地址
                for(var m in validData.featureLayersConf) {
                    var featureUrl = validData.featureLayersConf[m].url;
                    var preNameSpace = "/" + validData.featureLayersConf[m].nameSpace + "/";
                    validData.featureLayersConf[m].nameSpace = nameSpace;
                    var featureMatches = featureUrl.match(featureUrlRe);
                    if(featureMatches) {
                        var featureUrlArray = featureUrl.split(featureUrlRe);
                        var newStr = featureUrlArray[1].replace(preNameSpace,"/" + nameSpace + "/");
                        validData.featureLayersConf[m].url = featureUrlArray[0] + "?" + "http://" + element.value + newStr;
                    }
                    validData.featureLayersConf[m].crs = fCRS[nameSpace];
                    validData.featureLayersConf[m].netSP = fNetSP[nameSpace];

                    //根据配置文件修改图层的自动查询级别
                    for(var l in level[nameSpace]) {
                        if(l == m) {
                            validData.featureLayersConf[l].minZoom = level[nameSpace][l].minZoom;
                            validData.featureLayersConf[l].defaultZoom = level[nameSpace][l].defaultZoom;
                            validData.featureLayersConf[l].maxZoom = level[nameSpace][l].maxZoom;
                            if(level[nameSpace][l].auto == false) {
                                validData.featureLayersConf[l].auto = level[nameSpace][l].auto;
                            }

                            break;
                        }
                    }
                }
            } else {
                alert("请配置服务器地址!");
                openNewPage = false;
                return;
            }
        }
    });
}
$("#btnMongodb").on("click", function () {
    getValidConf();
    $.ajax({
        type: "post",
        url:  "/insertMongodb",
        data: {maptitle: "", mapconfig: JSON.stringify(validData),id: updateID},
        dataType: "json",
        success: function(e) {

            //测试代码，是否成功存入数据库
            console.log(e);
            alert("成功！！！");
        },
        error: function() {
            alert("失败!");
        }
    });
});
$("#btnMysql").on("click", function () {
    getValidConf();
    $.ajax({
        type: "post",
        url:  "/insertMysql",
        data: {maptitle: "", mapconfig: JSON.stringify(validData),id: updateID},
        dataType: "json",
        success: function(e) {

            //测试代码，是否成功存入数据库
            console.log(e);
            alert("成功！！！");
        },
        error: function() {
            alert("失败!");
        }
    });
});
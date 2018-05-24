/**
 * Created by Administrator on 2016/11/4.
 */
function init() {
    VitoGIS.init("phone.json",function(e){
        window.gis = e;
            layersConf = gis.layerManager.configManager.getFeatureLayersConf();//获取配置文件中要素的内容
//            gis.layerManager.zoomToWKT(features)
        L.drawLocal.draw.handlers.polygon.tooltip.cont="点击继续绘制";
        L.drawLocal.draw.handlers.polyline.tooltip.cont="点击继续绘制";
        L.drawLocal.draw.handlers.polygon.tooltip.end="点击起点结束绘制";
        L.drawLocal.draw.handlers.polyline.tooltip.end="点击终点结束绘制";
        gis.Events.on("DRAWEND",function(e){
            if(draw){
                var currentConf = gis.layerManager.currentConf;
                var layer = {
                    name: currentConf.geoType,
                    status: "1",
                    color: "red"
                };
                e.layer.addTo(gis.layerManager.drawLayer);
                gis.draw.doInsert(layer, function (data) {
                    console.log(data);
                });
            }else {
            }
        });
    });
}
var features =
    [
        {
            wkt: "POINT (116.41704 40.040680)",
            attr: {
                id: 40194,
                poiurl: {
                    def: "/dist/images/marker-icon.png",
                    over: "/dist/images/marker-icon.png",
                    pass: "/dist/images/marker-icon.png"
                },//要修改图片可以将属性的值设置为图片的路径
                title: '测试'
            }
        }
    ];
var changeFeatureLayerConf = function (type) {
    var conf = gis.layerManager.configManager.getFeatureLayersConf();
    for (var index in conf) {
        conf[index]["visible"] = false;
    }

    conf[type]["visible"] = true;
    gis.layerManager.configManager.setFeatureLayersConf(conf);
    gis.layerManager.loadLayers();
};

//绘制点

var draw=false;
var btnDrawPoint = document.getElementById("drawPoint");
btnDrawPoint.addEventListener("click", function (e) {
    draw=true;
    changeFeatureLayerConf("POINT");
    gis.draw.active(layersConf[gis.layerManager._currentLayerId].geoType,false);
});
//绘制线
var btnDrawPolyline = document.getElementById("drawPolyline");
btnDrawPolyline.addEventListener("click", function (e) {
    //gis.draw.active("polyline",false);

    draw=true;
    changeFeatureLayerConf("POLYLINE");
    gis.draw.active(layersConf[gis.layerManager._currentLayerId].geoType,false);

});
//绘制面
var btnDrawPolygon = document.getElementById("drawPolygon");
btnDrawPolygon.addEventListener("click", function (e) {
    //第二个参数不写，或者为false时，在绘制结束后不会给元素绑定对话框，但是会分发DRAWEND事件。可以监听DRAWEND事件，自定义绘制结束后的操作。
    //gis.draw.active("polygon",false);
    draw=true;
    changeFeatureLayerConf("POLYGON");
    gis.draw.active(layersConf[gis.layerManager._currentLayerId].geoType,false);

});
//测距
var btnDistance=document.getElementById("distance");
btnDistance.addEventListener("click",function(e){
    gis.tools.measureLength();
    draw=false;
});
//侧面
var btnArea=document.getElementById("area");

btnArea.addEventListener("click",function(e){
    gis.tools.measureArea();
    draw=false;
});
//清除
var btnClear=document.getElementById("clear");
btnClear.addEventListener("click",function(e){
    gis.layerManager.closeAll();
});
//    中心点
var btnCenter=document.getElementById("center");
btnCenter.addEventListener("click",function(e){
    gis.setCenter();

});
//    添加要素
var btnzoomWKT=document.getElementById("forWKT");
btnzoomWKT.addEventListener("click",function(e){
    gis.layerManager.zoomToWKT(features);

});
//单击双击切换
var btnTg = document.getElementById("tg");

var doubleClick = true;
btnTg.addEventListener("click", function (e) {

    if(doubleClick){
//            doubleClick = false;
        alert("请先点击“增加事件监听”按钮")

//            gis.Events.on("MAPCLICK", function (e) {
//                alert(e.latlng.lat + "," + e.latlng.lng);
//            });

        gis.Events.off("MAPDBCLICK");
    } else {
        doubleClick = true;
        gis.Events.on("MAPDBCLICK", function (e) {
            alert("触发了双击事件");
        });
        gis.Events.off("MAPCLICK");
    }
});
var btnyc = document.getElementById("yichu");
btnyc.addEventListener("click", function (e) {
    gis.Events.off("MAPDBCLICK");
    gis.Events.off("MAPCLICK");
    gis.Events.off("ZOOMCHANGE");
    gis.Events.off("MAPCLICK");
    gis.Events.off("MOVECHANGE");
});
var btnzj = document.getElementById("zj");
btnzj.addEventListener("click", function (e) {
    doubleClick = false;
    gis.Events.on("MAPCLICK", function (e) {
        alert(e.latlng.lat + "," + e.latlng.lng);
    });
    gis.Events.on("ZOOMCHANGE", function (e) {
        alert("缩放了地图");
    });
    gis.Events.on("MOVECHANGE", function (e) {
        alert("移动了地图");
    });
    gis.Events.on("MAPDBCLICK", function (e) {
        alert("触发了双击事件");
    });
});
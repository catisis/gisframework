/**
 * Created by Administrator on 2016/9/26.
 */
/**
 * Created by Administrator on 2016/9/8.
 */

function init(){
    VitoGIS.init("apiPage/js/conf.json",function(e){
        window.gis=e;
        //创建弹出框
        L.marker([40.040750,116.416700 ], {icon: myIcon}).addTo(gis.mapManager.map)
            .bindPopup("<b>北科创业大厦</b><br><b>地址：</b>北京市朝阳区北苑路28号")
            .openPopup();
        //创建地图缩放按钮
        var zoomControl = L.control.zoom({
            position: 'topleft'
        });
        gis.mapManager.map.addControl(zoomControl);
    });
}
//引入marker图片
var myIcon = L.icon({
    iconUrl: 'img/marker.png',
    iconSize: [25, 41]

});
//实现“配置文件”与“方法文件的切换”
function myfunctiona() {
    document.getElementById("conf").style.display="block";
    document.getElementById("js").style.display="none";
    document.getElementById("div_conf").style.backgroundColor="#f1f1f1";
    document.getElementById("div_js").style.backgroundColor="white";
}
//实现“配置文件”与“方法文件的切换”
function myfunctionb() {
    document.getElementById("js").style.display="block";
    document.getElementById("conf").style.display="none";
    document.getElementById("div_js").style.backgroundColor="#f1f1f1";
    document.getElementById("div_conf").style.backgroundColor="white";
}
//实现iframe自适应内部网页的高度而设定自身的高度；
function changeFrameHeight(id){
    var ifm = document.getElementById(id);
    //获取iframe内的文档元素
    var adb = ifm.contentDocument;
    ifm.height=0;
    ifm.height= adb.body.scrollHeight;
}







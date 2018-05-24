/**
 * Created by bk on 2016/6/14.
 * 显示鼠标所在的坐标
 */

VitoGIS.showCoordinatePoint = function(_this){
    this.method = _this;
    //创建标签
    var div = document.createElement('div');
    div.setAttribute("id", "showCoordinate");
    //创建两个span，存放经纬度
    var spanLat = document.createElement('span');
    spanLat.setAttribute("id","lat");
    var spanLng = document.createElement('span');
    spanLng.setAttribute("id","lng");
    div.appendChild(spanLat);
    div.appendChild(spanLng);
    //将div放到地图上
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(div);
    this.method.Events.on("MAPMOUSEMOVE", function (e) {
        document.getElementById("showCoordinate").style.display = 'block';
        document.getElementById("lat").innerHTML = "纬度：" + e.latlng.lat.toFixed(3);
        document.getElementById("lng").innerHTML = "经度：" + e.latlng.lng.toFixed(3);
    });
};

VitoGIS.showCoordinatePoint.prototype = {

};
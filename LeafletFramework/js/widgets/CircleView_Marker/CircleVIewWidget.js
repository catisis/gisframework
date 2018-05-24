/**
 * 工具组件 组件依赖transform组件
 *
 * @class VitoGIS.Tools
 */
VitoGIS.CircleViewWidget = function (method) {

    this.handler = method;

    var circleFeature = new L.featureGroup();
    circleFeature.addTo(this.handler.mapManager.map);

}
VitoGIS.CircleViewWidget.prototype = {
    // 这里写方法
    setView: function (features) {
        var result = [];
        var isLocate = true;
        var radius;
        var i = 1;
//        var wkt = 
//        if (!features[0].wkt)
//            isLocate = false;
        var geoType = features[0].wkt.substr(0, features[0].wkt.indexOf(" (")).toLowerCase() || "";
        for (var f in features) {
        	
            //判断是否存在feature
            if (!features[f]) {
                isLocate = false;
                continue;
            }
            //判断是否存在空间要素
            if (!features[f].wkt) {
                isLocate = false;
                continue;
            }

            var wkt = new Wkt.Wkt();
            wkt.read(features[f].wkt);
            var feature = wkt.toObject();
//            for (var i in this.conf) {
//                if (this.conf[i].minValue <= features[f].attr.total && features[f].attr.total <= this.conf[i].maxValue) {
//                    radius = this.conf[i].radius;
//                }
//            }


            feature.feature = {};
            feature.feature.properties = features[f].attr;

            var myIcon = new L.divIcon({
                iconAnchor: [100, 18], className: 'my-div-icon', html: '' +
                '<ul style=\"color: #ffffff;display:block;width:120px;\">' +
                '<li style=\"font-size: 28px; text-align: center;\"><a style=\"margin: 0 auto;color:#ffffff\">' + features[f].attr.total + '</a></li>' +
            //    '<li style=\"font-size: 14px; text-align: center;\"><a style=\"margin: 0 auto;color:#ffffff\">' + feature.feature.properties.areaMsg + '</a></li>' +
                '</ul>'
            });
            var center = feature.getBounds().getCenter();
            var marker = new L.marker(center, {icon: myIcon}).addTo(this.handler.layerManager.resultLayer);
            marker.feature = {properties: features[f].attr};
            marker.on("click", function (e) {
                e.properties = e.target.feature.properties;
                this.handler.Events.fire("MARKCLICK", e);
            }, this);
            result.push(feature);

        }
        var options = {
            "geoType": "polygon",
         //   "isZoom": true,
         //   "info": info,
            "isListen": true,
            "labelField": "title",
            "defaultStyle": {
                "fillOpacity": 0.5,
                "opacity": 0.1,
                "fillColor": "#CD4F39"
            },
            "passStyle": {
                "fillOpacity": 0.5,
                "opacity": 0.7,
                "fillColor": "#CD4F39"
            }
        }


       var resultLayer = this.handler.layerManager.addToMap(options, result);
        if (resultLayer) {
            gis.mapManager.map.fitBounds(resultLayer.getBounds())
        }

    },
    getRandomColor: function () {
        var c = '';
        var cArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        for (var i = 0; i < 6; i++) {
            var cIndex = Math.round(Math.random() * 15);
            c += cArray[cIndex];
        }
        return c;
    }

}

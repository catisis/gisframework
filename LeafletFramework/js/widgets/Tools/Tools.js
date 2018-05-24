/**
 * 工具组件 组件依赖transform组件
 *
 * @class VitoGIS.Tools
 */
VitoGIS.Tools = function (method) {
    this.handler = method;

    /**
     * 获取当前区域名称如：网格名称，街道，名称
     *
     * @method getArea
     * @params {[Object]} callback 回调函数，包括当前区域的所有属性
     */
//    function getArea(callback) {
//        var marker = new L.Marker(method.mapManager.map.getCenter());
//        var curZoom = method.mapManager.map.getZoom();
//
//        var param = {
//            where: "typename in ('" + method.ToolsConf.level[curZoom] + "')",
//            geom: marker
//        }
//        method.layerManager.doQuery(method.mapManager.configManager
//            .getFeatureLayersConf()[method.ToolsConf.targetLayer], param,
//            null, function (e) {
//                if (callback)
//                    callback(e.getLayers()[0].feature.properties);
//            })
//    }


    (function initOrg() {
        var marker = new L.Marker(method.mapManager.map.getCenter());
        var curZoom = method.mapManager.map.getZoom();
        var myStyle = {
            weight: 3,
            fillOpacity: 0,
            opacity: 0.8,
            fillColor: "#00FF00",
            dashArray: "10,10",
            color: "#00FF00"
        };
        currentConf = method.mapManager.configManager.getFeatureLayersConf()[method.ToolsConf.targetLayer];
        var param = {
            where: currentConf.filter
        }
        method.layerManager.doQuery(currentConf, param,
            null, function (e) {
                for (var i in e) {
                    var polygon = new L.polygon(e[i].getLatLngs(), myStyle)
                    //e[i].setStyle(myStyle);
                    polygon.addTo(this.map, "").bringToBack();
                }
            })
    })();

}
VitoGIS.Tools.prototype = {
    _getRes: function (zoom) {
        res = 156543.033928;
        return res / (Math.pow(2, zoom));
    },
    // 这里写方法
    getTileUrl: function (feature, levels, url) {
        var resultArr = [];

        var urlModle = url ? url : "http://116.213.144.131:8091/geoserver/gwc/service/wmts?service=WMTS&request=GetTile&version=1.0.0&layer=xcaj%3AXCAJ&format=image%2Fjpeg&height=256&width=256&TILEMATRIXSET=EPSG:900913&tilematrix=EPSG:900913:{z}&tilerow={y}&tilecol={x}";

        var orgin = [];
        var useSM = false;
        try {
            orgin = this.handler.layerManager._baseLayer._map.options.crs.options.origin;
        } catch (e) {
            orgin = [-20037508.342787, 20037508.342787];
        }


        var northEast = L.Projection.Mercator
            .project(feature.getBounds()._northEast);
        var southWest = L.Projection.Mercator
            .project(feature.getBounds()._southWest);

        var detaX = northEast.x - southWest.x;
        var detaY = northEast.y - southWest.y;

        var startX = Math.abs(southWest.x - orgin[0]);
        var startY = Math.abs(northEast.y - orgin[1]);
        debugger;
        for (var i in levels) {
            // var res = this.handler.layerManager._baseLayer._map.options.crs.options.resolutions[levels[i]];
            var res = this._getRes(levels[i]);
            var scale = 1 / ((res * 96) / 0.0254000508);
            var level = levels[i];
            var picLength = 256 * res;

            // 初始化切片序号计算
            var startXNum = Math.floor(startX / picLength);
            var startYNum = Math.floor(startY / picLength);

            // 计算需要下载的个数
            var xNum = Math.ceil(detaX / picLength);
            var yNum = Math.ceil(detaY / picLength);

            for (var xLoop = 0; xLoop <= xNum; xLoop++) {
                for (var yLoop = 0; yLoop <= yNum; yLoop++) {
                    var x = startXNum + xLoop;
                    var y = startYNum + yLoop;
                    var templateUrl = urlModle;
                    templateUrl = templateUrl.replace("{x}", x);
                    templateUrl = templateUrl.replace("{y}", y);
                    templateUrl = templateUrl.replace("{sm}", scale);
                    templateUrl = templateUrl.replace("{z}", level);
                    resultArr.push(templateUrl);
                }
            }
        }
        return resultArr;
    },
    setLevel: function () {

    },

    /**
     * 获取路径组件 #7 路径组件添加
     *
     * @method playRoute
     * @params {[Array]} points 轨迹点集
     * @params {[Boolean]} isZoom 是否缩放到图层
     * @return {[Object]} routeHandler
     *         返回路径播放组件，start()播放,stop()停止,设置options.interval，可以改变播放速度
     *
     */
    playRoute: function (points, isZoom) {
        if (points) {
            this.routeFeature = new L.polyline([]);
            this.routeLine = new L.polyline(points);
        } else
            return;
        this.routeFeature.addTo(this.handler.mapManager.map);

        this.routeMarker = L.animatedMarker(this.routeLine.getLatLngs(), {
            distance: 20,
            interval: 500,
            autoStart: false,
            routeFeature: this.routeFeature
        });
        this.handler.mapManager.map.addLayer(this.routeMarker);
        if (isZoom)
            this.handler.mapManager.map.setView(points[0]);

        return this.routeMarker;
    },

    autoBuilding: function (id) {
        var conf = this.handler.mapManager.configManager
            .getFeatureLayerConf(id);
        conf.filter = "";
        conf.defaultStyle.fillOpacity = 0;
        conf.passStyle.fillOpacity = 0;
        conf.visible = true;

        this.handler.layerManager.closeAll();
        var result = {};
        result[id] = conf;
        this.handler.layerManager.loadLayers(result);
    },
    measureArea: function (e) {
        this.handler.draw.active("polygon", false);
        // 解决交叉点击的问题
        if (gis.Events.listens("DRAWEND", this.measureLengthFunc)) {
            this.handler.Events.off("DRAWEND", this.measureLengthFunc, this)
        }
        this.handler.Events.once("DRAWEND", this.measureAreaFunc, this)
    },
    measureAreaFunc: function (e) {
        var arr = L.Projection.Mercator.project(e.layer._latlngs[0]);
        var tramList = [];
        if (gis.layerManager._currentBaseLayerConf.id == "defaultLayer") {
            for (var i in arr) {
                var point = this.handler.transform.mec25_to_gcj(arr[i].x, arr[i].y);
                var latlng = new L.latLng(point);
                tramList.push(latlng);
            }
        } else {
            tramList = e.layer._latlngs[0];
        }


        var area = L.GeometryUtil.geodesicArea(tramList);
        area = L.GeometryUtil.readableArea(area, true);
        e.layer.bindLabel(area, {
            noHide: true,
            offset: [12, -15]
        });

        e.layer.addTo(this.handler.layerManager.drawLayer)
    },
    measureLength: function () {
        this.handler.draw.active("polyline", false);
        // 解决交叉点击的问题
        if (gis.Events.listens("DRAWEND", this.measureAreaFunc)) {
            this.handler.Events.off("DRAWEND", this.measureAreaFunc, this)
        }
        this.handler.Events.once("DRAWEND", this.measureLengthFunc, this)
    },
    measureLengthFunc: function (e) {
        var arr = L.Projection.Mercator.project(e.layer._latlngs);
        var tramList = [];
        var length = 0;
        if (gis.layerManager._currentBaseLayerConf.id == "defaultLayer") {
            for (var i in arr) {
                var point = this.handler.transform.mec25_to_gcj(arr[i].x, arr[i].y);
                var latlng = new L.latLng(point);
                tramList.push(latlng);
                if (i > 0) {
                    length += tramList[i].distanceTo(tramList[i - 1]);
                }

            }
        } else {
            length = e.layer.length;
        }
        ;

        var length = L.GeometryUtil.readableDistance(length, true);
        var cc = e.layer.bindLabel(length, {
            noHide: true,
            offset: [12, -15]
        });
        e.layer.addTo(this.handler.layerManager.drawLayer)
    },
    layerToWKT: function(layer) {
        var wkt = new Wkt.Wkt();
        wkt.read( JSON.stringify(layer.toGeoJSON().geometry));
        return wkt.write();
    },
    latLngToWKT: function(lat,lng) {
        var latlng = new L.marker(lat,lng);
        var wkt = new Wkt.Wkt();
        wkt.read( JSON.stringify(latlng.toGeoJSON().geometry));
        return wkt.write();
    }
};

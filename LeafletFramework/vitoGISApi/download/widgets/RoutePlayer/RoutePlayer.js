/**
 * 工具组件 组件依赖transform组件
 *
 * @class VitoGIS.Tools
 */
VitoGIS.RoutePlayer = function (method) {
    this.handler = method;
    this._interval = 300;
    this._task = {};
}
VitoGIS.RoutePlayer.prototype = {
    // 这里写方法
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
    initRoute: function (features, isZoom) {
    	debugger
        var myFeatures = [];
        var markerList = [];
        for (var i in features) {

            var feature = new L.polyline(features[i].geom);
            feature.feature = {properties: features[i].attrs, id: (features[i].attrs.id + "-line"), currtimes: features[i].currtimes};
            myFeatures.push(feature);
            var picpath = features[i].attrs.picture;
            var myIcon = new L.divIcon({
                iconAnchor: [50, 122], className: 'my-div-icon', html: '' +
                '<div class=\"route-body\">' +
                "<i class=\"fa fa fa-times route-button route-close\" onclick=\"gis.routeplayer.close(\'" + features[i].attrs.id + "\')\" aria-hidden=\"true\"></i>" +
                '<div class=\"route-center\">' +
                //'<img class=\"route-img\" src="http://img.woyaogexing.com/2016/04/09/be600ae573ae0b0a!200x200.jpg">' +
                '<img class=\"route-img\" src="'+picpath+'">' +
                '</div>' +
                '<span id="startTime">' + features[i].attrs.begintime.substring(11,16) + '</span>' +
                '<span id="endTime">' + features[i].attrs.endtime.substring(11,16) + '</span>' +
                '<hr id="prossessed" class=\"route-line\">' +
                '<span id="track"></span>' +
                '<div id="routeTimer">' +
                '<span id="selfTime" style="color:#3399ff;position: relative;">00:00</span>' + 
                '</div>' +
                '<div class=\"route-btnbox\">' +
                "<i class=\"fa fa-backward route-button\" aria-hidden=\"true\" onclick=\"gis.routeplayer.back(\'" + features[i].attrs.id + "\')\"></i>" +
                "<i id=\"play\" class=\"fa fa-play route-button\" aria-hidden=\"true\"  onclick=\"gis.routeplayer.start(\'" + features[i].attrs.id + "\')\"></i>" +
                "<i class=\"fa fa-forward route-button\" aria-hidden=\"true\" onclick=\"gis.routeplayer.forward(\'" + features[i].attrs.id + "\')\"></div>" +
                '</div>'
            });

            var marker = new L.marker(features[i].geom[0], {icon: myIcon});
            marker.feature = {properties: features[i].attrs, id: features[i].attrs.id, currtimes: features[i].currtimes};
            markerList.push(marker);
            marker.addTo(this.handler.layerManager.resultLayer);
            feature.addTo(this.handler.layerManager.resultLayer);
            if (isZoom)
                gis.mapManager.map.fitBounds(gis.layerManager.resultLayer.getBounds());
        }
    },
    _delegate: function (marker, point, processed, id, index) {
        var _this = this;
        this._task[marker.feature.id].taskList.push(setTimeout(function () {
            marker.setLatLng(point)
            marker.getElement().className = marker.getElement().className.replace("disable", "my-div-icon");
            var prossessedLine = L.DomUtil.get("prossessed");
            prossessedLine.style.width = processed + "%";
            var selfTime = L.DomUtil.get("selfTime");
            var track = L.DomUtil.get("track");
            if(processed >= 95){
            	track.style.left = 95 + "%";
            } else {
            	track.style.left = processed + "%";	
            }
            selfTime.innerHTML = marker.feature.currtimes[index].substring(11,16);
            if(processed - 14 < 2) {
            	selfTime.style.left = 2 + "px";
            }else if(processed - 14 > 68){
            	selfTime.style.left = 68 + "px";
            } else {
            	selfTime.style.left = processed - 14 + "px";
            }
            _this._task[id].index = index;
            if (processed == 100) {
                marker.getElement().className = marker.getElement().className.replace("my-div-icon", "disable");
                _this._changeState(id, "stop");
            }
        }, point.speed))
    },
    _changeState: function (id, state, i) {
        var play = L.DomUtil.get("play");
        var _this = this;
        switch (state) {
            case "start":
                play.className = play.className.replace("fa-play", "fa-pause");
                play.onclick = function () {
                    _this.pause(id)
                };
                this._task[id].state = "start";
                break;
            case "stop":
                play.className = play.className.replace("fa-pause", "fa-play");
                play.onclick = function () {
                    _this.start(id)
                };
                this._task[id].state = "stop";
                this._interval = 150;
                break;
            case "pause":
                play.className = play.className.replace("fa-pause", "fa-play");
                play.onclick = function () {
                    _this.start(id, i)
                };
                this._task[id].state = "pause";
                break;

        }

    },
    start: function (id, i, flag) {
        var ii = 1;

        var marker = this.handler.layerManager.resultLayer.getLayer(id);
        var lineId = id + "-line";
        var route = this.handler.layerManager.resultLayer.getLayer(lineId).getLatLngs();

        if (i) {
            ii = i;
        } else {
            marker.setLatLng(route[0]);
            if (flag == "back") {
                ii = route.length - 1;
            }
        }


        this._task[marker.feature.id] = {state: "start", index: 1, taskList: [], interval: this._interval};
        this._changeState(id, "start");

        if (flag == "back") {
            count = 0;
            for (ii; ii >= 0; ii--) {
                route[ii].speed = (this._task[marker.feature.id].interval * count++);
                var processed = (ii / route.length) * 100
                this._delegate(marker, route[ii], processed, id, ii);
            }
        } else {
            for (ii; ii < route.length; ii++) {
                route[ii].speed = (this._task[marker.feature.id].interval * ii);
                var processed = ((ii + 1) / route.length) * 100
                this._delegate(marker, route[ii], processed, id, ii);
            }
        }
    },
    back: function (id) {
        this.pause(id);
        this.start(id, this._task[id].index, "back");
    },
    forward: function (id) {
        this.pause(id);
        this._interval = 500;
        this.start(id, this._task[id].index);
    },
    stop: function (id) {
        for (var i in this._task[id].taskList) {
            console.log(clearTimeout(this._task[id].taskList[i]));
        }
        this._changeState(id, "stop");
    },
    pause: function (id) {
        for (var i in this._task[id].taskList) {
            console.log(clearTimeout(this._task[id].taskList[i]));
        }
        this._changeState(id, "pause", this._task[id].index);
    },
    close: function (id) {
        var marker = this.handler.layerManager.resultLayer.getLayer(id);
        var lineId = id + "-line";
        var route = this.handler.layerManager.resultLayer.getLayer(lineId);
        this.handler.layerManager.resultLayer.removeLayer(marker);
        this.handler.layerManager.resultLayer.removeLayer(route);
    }


}

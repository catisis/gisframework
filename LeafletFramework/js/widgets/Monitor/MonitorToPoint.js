/**
 * Created by bk on 2017/6/19.
 */
VitoGIS.MonitorPoint = function (_this) {
    this.method = _this;
};
VitoGIS.MonitorPoint.prototype = {
    locate: function(point,divOptions,content,styleName,showtime) {
        var options = {};
        if (divOptions) {
            options = divOptions;
        }

        var marker = L.marker(point,options);
        marker.addTo(this.method.mapManager.map);
        //.bindPopup(content ,{offset: [0,14],className: styleName,autoClose: false}).openPopup();

        var labelIcon = L.divIcon({
            className:"monitorLabel " + styleName,
            html: content
        });
        var markerLabel = L.marker(point,{icon: labelIcon});
        markerLabel.addTo(this.method.mapManager.map);

        setTimeout(function(){
            marker.remove();
            markerLabel.remove();
        }, showtime);
    },
    location: function (point,divOptions,content,showtime) {
        var resultLayer = this.method.layerManager.resultLayer;
        var that = this.method;
        var options = {};
        if (divOptions) {
            options = divOptions;
        }

        //地图上添加覆盖物
        var marker = L.marker(point,options);
        marker.addTo(resultLayer);

        //绑定popup
        if(content){
            marker.bindPopup('',{
                maxWidth: 800,
                maxHeight: 800,
                offset: [0, -20],
                className: "MonitorInfo"
            });
            marker.on("popupopen", function (e) {
                that.currentMark  = this;
                this.setPopupContent(content);
            });
        }
        if(showtime){
            setTimeout(function(){
                marker.remove();
            }, showtime);
        }
    },
    removeMark: function () {
        debugger;
        this.method.currentMark .remove();
    }
};
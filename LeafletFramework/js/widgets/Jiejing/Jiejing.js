VitoGIS.Jiejing = function (_this) {
	this.method = _this;
};
VitoGIS.Jiejing.prototype = {
    get: function () {
    	this.method.draw.active("point",false);
    	this.method.Events.once("DRAWEND",function(e){
            var feature = e.layer;
           // var mactor = L.Projection.Mercator.project(feature._latlng);
            var latlng = this.transform.degree25_to_gcj(feature._latlng.lat, feature._latlng.lng);
            var conf = this.JiejingConf;
            var lat = latlng.lat;
            var lng = latlng.lng;
            feature.bindPopup("<iframe src='" + __ctx + conf.panelUrl + "?lng="+lng+"&lat="+lat+"' style = 'width: 400px;height: 300px;background-color: #ffffff;border: none;'></iframe>", {maxWidth: 500, maxHeight: 500, className: "info"});
            feature.addTo(gis.layerManager.drawLayer).openPopup();
        },this.method)
    }
}


/**
 * Created by bk on 2016/10/11.
 */
VitoGIS.DistrictPolygons = function (_this) {
    this.method = _this;
};

VitoGIS.DistrictPolygons.prototype = {
    drawDist: function(data) {
        var markerArray = [];
        for(var i = 0; i < data.length; i++) {
            var ply = new L.polygon(data[i].poly_pts, data[i].poly_style);
            markerArray.push(ply);
        }
        var bounds = L.featureGroup(markerArray)
            .addTo(this.method.mapManager.map)
            .getBounds();
        this.method.mapManager.map.fitBounds(bounds).setZoom(gis.mapManager.map.getScaleZoom(1.15));
    },
    addLabel: function(data) {
        for(var i = 0; i < data.length; i++) {
            var myIcon = L.divIcon({
                className:"QXName",
                iconSize:[12,12],
                html: data[i].name
            });
            var marker = L.marker([data[i].center.lat, data[i].center.lng],{icon:myIcon});
            marker.addTo(this.method.mapManager.map);
        }

    }
};
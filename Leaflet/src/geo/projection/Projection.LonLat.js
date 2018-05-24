/*
 * Simple equirectangular (Plate Carree) projection, used by CRS like EPSG:4326 and Simple.
 */

L.Projection = {};

L.Projection.LonLat = {
    project: function (latlng) {
        if (L.Util.isArray(latlng)) {
            var points = [];
            for (var i in latlng) {
                points.push(new L.Point(latlng[i].lng, latlng[i].lat));
            }
            return points;
        } else {
            return new L.Point(latlng.lng, latlng.lat);
        }

    },

    unproject: function (point) {
        if (L.Util.isArray(point)) {
            var points = [];
            for (var i in point) {
                points.push(new L.Point(point[i].lng, point[i].lat));
            }
            return points;
        } else {
            return new L.LatLng(point.y, point.x);
        }

    },

    bounds: L.bounds([-180, -90], [180, 90])
};

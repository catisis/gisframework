L.Projection.GCJ02 = L.extend({} , L.chinaProj,{
    project: function (latlng) { // (LatLng) -> Point
        if(L.Util.isArray(latlng)){
            var points = [];
            for (var i in latlng){
                var temPoint = this.gcj_To_Gps84(latlng[i].lat,latlng[i].lng)
                points.push(new L.Point(temPoint[1],temPoint[0]));
            }
            return points;
        }else{
            var temPoint = this.gcj_To_Gps84(latlng.lat,latlng.lng)
            var point = new L.Point(temPoint[1],temPoint[0]);
            return point;
        }

    },

    unproject: function (point) { // (Point, Boolean) -> LatLng
        var temLatlng = this.gps84_To_Gcj02(point.y,point.x);
        if(!temLatlng)
        return new L.LatLng(0,0);
        var latlng = new L.LatLng(temLatlng[0],temLatlng[1]);
        return latlng;
    }
});

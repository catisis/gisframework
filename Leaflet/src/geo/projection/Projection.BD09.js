L.Projection.BD09 = L.extend({} , L.chinaProj,{
    project: function (latlng) { // (LatLng) -> Point
        if(L.Util.isArray(latlng)){
            var points = [];
            for (var i in latlng){
                var temPoint = this.bd09_To_Gcj02(latlng[i].lat,latlng[i].lng)
                points.push(new L.Point(temPoint[1],temPoint[0]));
            }
            return points;
        }else{
            var temPoint = this.bd09_To_Gcj02(latlng.lat,latlng.lng)
            var point = new L.Point(temPoint[1],temPoint[0]);
            return point;
        }

    },
    unproject: function (point) { // (Point, Boolean) -> LatLng
        var temLatlng = this.gps84_To_Gcj02(point.y,point.x);
        var tem84 = this.gcj02_To_Bd09(temLatlng[0],temLatlng[1]);
        if(!tem84)
            return new L.LatLng(0,0);
        var latlng = new L.LatLng(tem84[0],tem84[1]);
        return latlng;
    }
});

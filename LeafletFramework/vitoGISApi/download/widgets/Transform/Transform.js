/**
 * 工具组件
 *
 * @class VitoGIS.Tools
 */
VitoGIS.Transform = function (method) {
    this.handler = method;
    this.A = this.handler.TransformConf.A
    this.B = this.handler.TransformConf.B
    this.C = this.handler.TransformConf.C
    this.D = this.handler.TransformConf.D
    this.E = this.handler.TransformConf.E
    this.F = this.handler.TransformConf.F
}
VitoGIS.Transform.prototype = {
    _transform: {
        //x 为lng ,y 为lat
        point2To25: function (x, y) {
        	debugger;
            var p = {};
            var xx = this.A * x + this.B * y - this.C;
            var yy = this.E * y - this.D * x + this.F;
            p.x = xx;
            p.y = yy;
            return p;
        },
        point25To2: function (x, y) {
            var p = {};
            var xx = (this.E * x - this.B * y + this.F * this.B + this.E * this.C) / (this.A * this.E + this.B * this.D);
            var yy = (0 - this.D * x - this.A * y + this.A * this.F - this.C * this.D) / (0 - this.B * this.D - this.A * this.E);
            p.x = xx;
            p.y = yy;
            return p;
        }
    },
    gps_to_25_degree: function (lat, lng) {
        var gcj = L.chinaProj.gps84_To_Gcj02(lat, lng);
        var point25 = this._transform.point2To25.call(this,gcj[1], gcj[0]);
        var latlng = L.Projection.Mercator.unproject(point25);
        return [latlng.lat, latlng.lng];
    },
    gps_to_25_mec: function (lat, lng) {
        var gcj = L.chinaProj.gps84_To_Gcj02(lat, lng);
        var point25 = this._transform.point2To25.call(this,gcj[1], gcj[0]);
        return [point25.x, point25.y];
    },
    gcj_to_25_mec:function(lng,lat){
    	 var point25 = this._transform.point2To25.call(this,lng, lat);
         return [point25.x, point25.y];
    },
    gcj_to_25_degree:function(lng,lat){
   	 var point25 = this._transform.point2To25.call(this,lng, lat);
     var latlng = L.Projection.Mercator.unproject(point25);
        return [latlng.lat, latlng.lng];
   },
    degree25_to_gcj: function (lat, lng) {
        var mecator = L.Projection.Mercator.project({lat: lat, lng: lng});
        var latlng = this._transform.point25To2.call(this,mecator.x, mecator.y);
        return {lat: latlng.y, lng: latlng.x};

    },
    mec25_to_gcj:function(x,y){
        var point = this._transform.point25To2.call(this,x, y);
        return [point.y, point.x];
    }

}

// VitoGIS.tools = new VitoGIS.Tools();


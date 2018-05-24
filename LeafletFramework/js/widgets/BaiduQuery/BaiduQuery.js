

VitoGIS.BaiduQuery = function (_this) {
	//2维 2.5维转换
	var transform = {
			A:629486.1,               
			B :850786,
			C :106392700,
			D :321586.1,
			E :380061.7,
			F :23949170,
			project:function(point){
				var pointArr = L.chinaProj.bd09_To_Gcj02(point.lat,point.lng)
				var x = pointArr[1];
				var y = pointArr[0];
				var p = {};
				var xx = this.A*x+this.B*y-this.C;
				var yy = this.E*y-this.D*x+this.F;
				p.x = xx;
				p.y = yy;
				return p;
			},
			//lon,lat
			point25To2:function(x,y){
				var p = {};
				var xx = (this.E*x-this.B*y+this.F*this.B+this.E*this.C)/(this.A*this.E+this.B*this.D);
				var yy = (0-this.D*x-this.A*y+this.A*this.F-this.C*this.D)/(0-this.B*this.D-this.A*this.E);
				p.x = xx;
				p.y = yy;
				return p;
			}
	}
	debugger;
    new L.Control.GeoSearch({
        position: _this.BaiduQueryConf.position,
        proj: transform,
        isProjInMap:true,
        provider: new L.GeoSearch.Provider.Bing({
            // request your free key at: bingmapsportal.com
        	region:"东营市",
            proxy: _this.BaiduQueryConf.proxy,
            key: _this.BaiduQueryConf.key
        })
    }).addTo(_this.mapManager.map);
};
VitoGIS.BaiduQuery.prototype = {}

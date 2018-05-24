VitoGIS.AreaAnalysis = function(_this){
	this.method = _this;
};

VitoGIS.AreaAnalysis.prototype = {
    doSelect:function(){
    	var self = this;
    	this.method.draw.active("polygon",false);
    	this.method.Events.once("DRAWEND",function(e){
    		var wkt = new Wkt.Wkt()
    		var _wkt = wkt.fromJson(e.layer.toGeoJSON().geometry).toString();
    		qyqxWkt = _wkt;
    		
    		/* 计算圈选区域的面积 */
    		var arr = L.Projection.Mercator.project(e.layer._latlngs[0]);
            var tramList = [];
            tramList = e.layer._latlngs[0];
            var area = L.GeometryUtil.geodesicArea(tramList);
            console.log(area);
    		
    		var moudle = "<div style='width: 445px;height: 430px;position: relative;overflow: hidden;box-sizing: border-box;background-color: #ffffff;'>" +
            " <div style='height: 34px;line-height: 34px;background: url(../../common/mapPanel/images/panel_header_bg.png) no-repeat left center;padding-left: 45px;color: #fff;font-size: 14px;font-family: '宋体',sans-serif;'>" +
            "<span>区域圈选分析</span>" +
            "<span style='display: inline-block;float: right;width: 38px;height: 100%;background-color: #fe6c45;'></span>" +
            "</div> " +
            "<div style='width: 100%;position: absolute;top: 34px;bottom: 0px;overflow: hidden;'>" +
            " <iframe src='"+this.AreaAnalysisConf.panelUrl+"?wkt="+_wkt+"&area="+area+"' style='border: 0px;width: 100%; height: 100%;'></iframe> " +
            "</div> " +
            "</div>"
            
    		e.layer.addTo(gis.layerManager.drawLayer);
    		e.layer.bindPopup(moudle, {maxWidth: 500, maxHeight: 450,  autoPanPadding: [50, 130], className: "info"});
    		e.layer.openPopup(e.layer.getBounds().getCenter());
        },this.method)
    }
}

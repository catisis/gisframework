VitoGIS.AreaAnalysis = function(_this){
	this.method = _this;
};

VitoGIS.AreaAnalysis.prototype = {
    doSelect:function(){
    	this.method.draw.active("polygon",false);
    	this.method.Events.once("DRAWEND",function(e){
    		var wkt = new Wkt.Wkt()
    		var _wkt = wkt.fromJson(e.layer.toGeoJSON().geometry).toString();
    		qyqxWkt = _wkt;
    		debugger;
    		
    		var moudle = "<div style='width: 500px;height: 390px;position: relative;overflow: hidden;box-sizing: border-box;background-color: #ffffff;'>" +
            " <div style='height: 30px;line-height: 30px;border-bottom: 1px #ddd solid;background-color: #7ac9f2;color: #fff;font-size: 14px;font-family: Microsoft YaHei;padding: 0px 5px;'>" +
            "<span>区域圈选分析</span>" +
            "</div> " +
            "<div style='width: 100%;position: absolute;top: 30px;bottom: 0px;overflow: hidden;'>" +
            " <iframe src='"+this.AreaAnalysisConf.panelUrl+"?wkt="+_wkt+"' style='border: 0px;width: 100%; height: 100%;'></iframe> " +
            "</div> " +
            "</div>"
            
    		e.layer.addTo(gis.layerManager.drawLayer);
    		e.layer.bindPopup(moudle, {maxWidth: 500, maxHeight: 450,  autoPanPadding: [50, 130], className: "info"});
    		e.layer.openPopup(e.layer.getBounds().getCenter());
        },this.method)
    }
}

/**
 * 图层管理模块
 * @module VitoGIS.LayerManager
 * */

/**
 * 图层控制,通过Vitogis.init()方法后使用
 * @class VitoGIS.LayerManager
 * @extends VitoGIS.Query
 * */
VitoGIS.LayerManager = function (_this) {

    VitoGIS.Query.call(this, _this);

    this.map = _this.mapManager.map;
    this.configManager = _this.mapManager.configManager;
    this._currentBaseLayerConf = _this.mapManager._currentBaseLayerConf;

    /**
     * 用来存储返回的要素
     *@property resultLayer
     * */
    this.resultLayer = new L.featureGroup();
    this.resultLayer.addTo(this.map);

    /**
     * 用来存储绘制后的要素
     *@property drawLayer
     * */
    this.drawLayer = new L.featureGroup();
    this.drawLayer.id = "drawLayer";
    this.drawLayer.addTo(this.map, "drawLayer");


}

VitoGIS.inherit(VitoGIS.LayerManager, VitoGIS.Query);

VitoGIS.LayerManager.prototype.loadBaseLayer = function () {
    var baseLayers = new L.LayerGroup();
    var baseLayersConf = this.configManager.getBaseLayerConf();
    for (var layerIndex in baseLayersConf) {
        var currentConf =baseLayersConf[layerIndex];
        if (!currentConf.visible) {
            continue;
        }


        var baseLayer = new L.tileLayer(currentConf.mapUrl, {
            maxZoom: currentConf.maxZoom || 18,
            minZoom: currentConf.minZoom || 11,
            tms: currentConf.tms || false,
            tileSize: currentConf.tileSize || 256,
            errorTileUrl: "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",
            subdomains: currentConf.subdomains || ["01", "02", "03", "04"],
            detectRetina: currentConf.detectRetina,
            zoomAnimation:false,
            touchZoom:false
        }).addTo(baseLayers, "map")
        if (currentConf.labelUrl) {
            var labelLayer = new L.tileLayer(currentConf.labelUrl, {
                //  opacity: 0.5,
                maxZoom: currentConf.maxZoom || 18,
                minZoom: currentConf.minZoom || 11,
                tms: currentConf.tms || false,
                tileSize: currentConf.tileSize || 256,
                errorTileUrl: "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",
                subdomains: currentConf.subdomains || ["01", "02", "03", "04"],
                detectRetina: currentConf.detectRetina,
                zoomAnimation:false,
                touchZoom:false
            }).addTo(baseLayers, "label")
        }

        this._baseLayer = baseLayers;


        this.baseLayer = baseLayers.addTo(this.map, "baseLayer");
        if (this._currentBaseLayerConf.center && this._currentBaseLayerConf.initLevel) {
            this.map.setView(this._currentBaseLayerConf.center, this._currentBaseLayerConf.initLevel);
        }
        else {
            console.log("请配置图层center和initLevel属性");
        }

        return baseLayers;
    }
}
/**
 *  切换底图
 *  @method changeBaseLayer
 *  @param {[String]} name 图层id
 * */
VitoGIS.LayerManager.prototype.changeBaseLayer = function (id) {
    if (this._baseLayer)
        this.map.removeLayer(this._baseLayer);

    var confTest = this.configManager.getBaseLayerConf();
    if (confTest[id].crs)
        this.map.options.crs = L.Util.isArray(confTest[id].crs) ? this.currentThis.mapManager.getRes(confTest[id].crs) : L.CRS[confTest[id].crs];
    else
        this.map.options.crs = L.CRS.UNKNOWN;

    this._currentBaseLayerConf = confTest[id];

    for (var i in confTest) {
        confTest[i].visible = false;
    }
    confTest[id].visible = true;
    this.configManager.setBaseLayerConf(confTest);
    this.loadBaseLayer();
}

/**
 * 显示图层
 * @method openLayer
 * @param {[String]} name 图层id
 * */
VitoGIS.LayerManager.prototype.openLayer = function (name) {
    var map = this.map;
    var conf = this.configManager.getFeatureLayersConf();
    for (var item in conf) {
        if (conf[item].layers) {
            for (var per in conf[item].layers) {
                conf[item].layers[per].visible = conf[item].layers[per].id == name ? true : false;
            }
        }
        else {
            conf[item].visible = conf[item].id == name ? true : false;
        }
    }

    this._currentLayerId = name;
    this.configManager.setFeatureLayersConf(conf);
    this.loadLayers();
}

/**
* 处理图层与另一图层图形匹配
* @method dealLayer
* */
VitoGIS.LayerManager.prototype.dealLayer = function (name, fn) {
    var params = {};
    params.where = "";
    var featureLayerConf = this.configManager.getFeatureLayersConf();
    var currentConf = featureLayerConf[name];
    var matchConf = {};
    if(currentConf.matchLayerName){
        matchConf = featureLayerConf[currentConf.matchLayerName];
    }
    switch (currentConf.serverType) {
        case "OGC":
            if(this._currentBaseLayerConf.id != "defaultLayer"){
                return [];
            }
            var callback = function (features) {
                this.queryFeature(name, currentConf, matchConf, features, fn);
            }
            this.doQuery(currentConf, params, null, callback);
            break;
        case  "Supermap":
            if(this._currentBaseLayerConf.id != "xcajLayer"){
                return [];
            }
            var callback = function(a){
                this.queryFeature(name, currentConf, matchConf, a._layers, fn);
            }
            this.doQuery(currentConf, params, null, callback);
            break;
    }
}

/*
 * 高亮显示被匹配图形
 * */
VitoGIS.LayerManager.prototype._getMatchFeature = function (layername, id, type, eventtype) {
    var layerid;
    switch (type) {
        case 3:
            layerid = "smid" + id;
            break;
        case 2:
            layerid = layername + "." + id;
            break;
    }
    var target;
    if(this.map._layers[layername]){
        target= this.map._layers[layername]._layers[layerid];
    }
    if (target){
        if(eventtype == "over"){
            this._changeHighLight(target);
        }else if (eventtype == "out"){
            this._changedefault(target);
        }
        return true;
    }else{
        return false;
    }
}

/**
 *  清除当前所有图层
 *  @method cleanAll
 * */
VitoGIS.LayerManager.prototype.cleanAll = function () {
    this.closeInfo();
    this.drawLayer.clearLayers();
    for (var id in this.configManager.getFeatureLayersConf()) {
        if (this.map._layers[id]) {
            this.cleanLayer(id);
            var chilrendLayer = this.map._layers[id].getLayers();
            for (var index in  chilrendLayer) {
                chilrendLayer[index].clearLayers();
            }
        }
    }
    this.resultLayer.clearLayers();
}

/**
 *  清除当前所有图层
 *  @method cleanLayer
 * */
VitoGIS.LayerManager.prototype.cleanLayer = function (name) {
    this.map._layers[name].clearLayers();
}
/**
 *  关闭当前所有图层
 *  @method closeAll
 * */
VitoGIS.LayerManager.prototype.closeAll = function () {
    this.closeInfo();
    this.drawLayer.clearLayers();
    var conf = this.configManager.getFeatureLayersConf();
    this.resultLayer.clearLayers();
    for (var index in conf) {
        conf[index].visible = false;
    }
    this.configManager.setFeatureLayersConf(conf);
    this.loadLayers();
}

/**
 * 关闭图层
 * @method closeLayer
 * @param {[String]} name 图层id
 * */
VitoGIS.LayerManager.prototype.closeLayer = function (name) {
    var conf = this.configManager.getFeatureLayersConf();
    conf[name].visible = false;
    this.configManager.setFeatureLayersConf(conf);
    this.loadLayers();
}

//VitoGIS.layerManager = new VitoGIS.LayerManager(VitoGIS.map);


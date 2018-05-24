/**
 *  绘制模块
 *  @module VitoGIS.Draw
 * */


/**
 * 提供绘制功能
 *
 * 框架中直接在VitoGIS.Transaction.js中实例化的，所以Draw的一切方法在VitoGIS.transaction中调用
 * @private
 * @class VitoGIS.Draw
 * @extends VitoGIS.MapHandler
 *
 */
VitoGIS.Draw = function (_this) {

    if (!_this)
        return;
    this._crs = L.CRS.GCJ02;

    if (_this.layerManager)
        this.layerManager = _this.layerManager;
    if (_this.mapManager)
        this.configManager = _this.mapManager.configManager;

    this._map = _this.mapManager.map;
    //   this._info = this._getIframe("Draw");

    this._drawMark = new L.Draw.Marker(this._map);
    this._drawLine = new L.Draw.Polyline(this._map, {
        metric: true,
        showLength:false,
        shapeOptions: {
            color: '#ff0101',
            weight: 4,
            opacity: 1,
        }
    });
    this._drawPolygon = new L.Draw.Polygon(this._map, {
        allowIntersection: false,
        showArea: false,
        drawError: {
            color: '#000000',
            timeout: 1000
        },
        shapeOptions: {
            color: '#ff0101'
        }
    });
    this._drawRect = new L.Draw.Rectangle(this._map, {
        metric: false
    });
    VitoGIS.MapHandler.call(this, _this);
    //TODO 弹出窗口配置
    this._map.on('draw:created', this._drawEnd, this);
    this._map.on('draw:edited', this._editEnd, this);

}

VitoGIS.inherit(VitoGIS.Draw, VitoGIS.MapHandler);

//VitoGIS.Draw.prototype = new VitoGIS.Proto();

VitoGIS.Draw.prototype._editEnd = function (e) {
    //debugger;
}
VitoGIS.Draw.prototype._drawEnd = function (e) {
    var that = this;
    if (e.layerType == 'rectangle') {
        this._map.fitBounds(e.layer.getBounds());
        return;
    }
    var layer = this.layerManager.drawLayer;
    this.drawLayer = this.layerManager.drawLayer;

    this.currentConf = this.configManager.getFeatureLayerConf(this.layerManager._currentLayerId);
    var context = null;
    if (this.currentConf) {
        context = this._info = this._getIframe(this.currentConf.info, "", "editPage");
    }


    layer.clearLayers();
    var type = e.layerType,
        feature = e.layer;
    feature.feature = {properties: {}};
    if (!_isListen) {
        this.currentThis.Events.fire("DRAWEND", e);
        return;
    }
    feature.on("popupopen", function (e) {
        that._setIframe(that.currentConf.info, "", "editPage",this);
    });
    feature.bindPopup(context, {maxWidth: 500, maxHeight: 500, className: "info"});
    if (type === 'marker') {
        feature.addTo(layer).openPopup()
    }
    else {
        feature.addTo(layer).openPopup(feature.getBounds().getCenter())
    }
    this._setInfo(feature);
}
/**
 * 绘制
 * @method active
 * @param {[String]} type 绘制类型point，polyline，polygon
 * @param {[boolen]} isListen 是否监听
 * */
VitoGIS.Draw.prototype.active = function (type, isListen) {
    _isListen = isListen || false;
    this.deactive();
    switch (type) {
        case "point":
            this._drawMark.enable();
            break;
        case "polyline":
            this._drawLine.enable();
            break;
        case "polygon":
            this._drawPolygon.enable();
            break;
        case "rect":
            this._drawRect.enable();
            break;
    }

}
/**
 * 结束绘制
 * @method deactive
 * */
VitoGIS.Draw.prototype.deactive = function () {
    this._drawPolygon.disable();
    this._drawLine.disable();
    this._drawMark.disable();
    this._drawRect.disable();
    if (this._editFeature) {
        this._editFeature.save();
        this._editFeature.disable();
        this._editFeature = null
    }
}
/**
 * 编辑要素
 * @method edit
 * @params {[FeatureFroup]} featureGroup featureGroup
 * */
VitoGIS.Draw.prototype.edit = function (featureGroup) {
    if (featureGroup)
        this._editFeature = new L.EditToolbar.Edit(this._map, {featureGroup: featureGroup, remove: false});
    else console.log("没有传入featureGroup");
    this._editFeature.enable();
}
VitoGIS.Draw.prototype.revert = function () {
    if (this._drawPolygon._enabled)
        this._drawPolygon.deleteLastVertex();
    if (this._drawLine._enabled)
        this._drawLine.deleteLastVertex();
}

//VitoGIS.draw = new VitoGIS.Draw(VitoGIS.map);

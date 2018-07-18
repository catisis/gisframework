/**
 基础模块

 @module MapBaseModule
 */

/**
 * 提供对要素的在线编辑的入库操作
 * @Class VitoGIS.MapHandler
 * @extends VitoGIS.Proto
 */
VitoGIS.MapHandler = function (_this) {

    VitoGIS.Proto.call(this, _this);
    this._currentLayerId = null;
}
VitoGIS.inherit(VitoGIS.MapHandler, VitoGIS.Proto);
/**
 * 获取当前矢量图图层的id
 * @method getCutLyId
 * */
VitoGIS.MapHandler.prototype.getCutLyId = function () {
    return this._currentLayerId;
}
/**
 * 设置当前矢量图图层的id
 * @method setCutLyId
 * @params {String} id 需要设置的id
 * */
VitoGIS.MapHandler.prototype.setCutLyId = function (id) {
    this._currentLayerId = id;
}
/**
 * 对要素进行处理，给要素添加一些框架中将要用到的事件
 *
 * 要环境  context = {
     *              defaultStyle: defaultStyle,
     *               passStyle: passStyle,
     *               overStyle: overStyle,
     *               method: method
     *           }
 *
 * @method _featureEventHandler
 * @private
 * @param {[L.Marker,l.Polygon,L.Polyline]} features 要素集合
 * @param {[Object]} conf 当前配置文件
 * */
VitoGIS.MapHandler.prototype._featureEventHandler = function (feature, conf, id) {

    var defaultStyle = this.defaultStyle,
        passStyle = this.passStyle,
        overStyle = this.overStyle,
        offset = this.offset || [12, -15],
        method = this.method,
        currentThis = this.currentThis,
        context;
    //定义mouseOn时的事件
    var mouseoutFuc = function (target) {
        if (this.passStyle.fillColor && target.target.feature.properties.INCOLOR)
            this.passStyle.fillColor = target.target.feature.properties.INCOLOR
        else
            this.passStyle.fillColor = "#000000";
        if (this.passStyle.options && target.target.feature.passIconUrl) {
            this.passStyle.options.iconUrl = target.target.feature.passIconUrl;
            this.defaultStyle.options.iconUrl = target.target.feature.defaultIconUrl;
        }

        target.target[method](target.target.feature.isPass ? this.passStyle : this.defaultStyle)
    }
    //定义mouseOver时的方法
    var mouseoverFuc = function (target) {
        if (overStyle.options && target.target.feature.overIconUrl)
            overStyle.options.iconUrl = target.target.feature.overIconUrl;
        target.target[method](overStyle)
    }

    //如果数据属性中有INCOLOR这个字段，则用INCOLOR中字段的颜色表示
    passStyle.fillColor = feature.feature.properties.INCOLOR || "000000";
    //如果有数据属性中有ICON这个字段则选择用ICON字段中的图标
    if (this.passStyle.options && feature.feature.properties.PASSICON && feature.feature.properties.DEFICON && feature.feature.properties.OVERICON) {
        passStyle.options.iconUrl = feature.feature.properties.PASSICON || passStyle.options.iconUrl;
        defaultStyle.options.iconUrl = feature.feature.properties.DEFICON || passStyle.options.iconUrl;
        overStyle.options.iconUrl = feature.feature.properties.OVERICON || passStyle.options.iconUrl;

        feature.feature.passIconUrl = passStyle.options.iconUrl;
        feature.feature.defaultIconUrl = defaultStyle.options.iconUrl;
        feature.feature.overIconUrl = overStyle.options.iconUrl;
    }

    context = {
        passStyle: passStyle,
        defaultStyle: defaultStyle,
        overStyle: overStyle,
        conf: conf
    }

    feature.on("mouseover", function (e) {
        var _this = this;
        mouseoverFuc.call(this, e);
        if(conf.isCalibration){
            VitoGIS._getEvents().Events.fire("FEATUREMOUSEOVER", _this); //必须与框架使用同一个E
        }
    })

    if (feature.feature.properties.ISBUSINE)
        var isPass = feature.feature.properties.ISBUSINE == "1" ? true : false;
    else {
        isPass = feature.feature.properties.isbusine == "1" ? true : false;
    }

    feature[method](isPass ? passStyle : defaultStyle);

    feature.bindLabel(feature.feature.properties[conf.labelField] || "", {
        offset: offset,
        direction: "auto",
        noHide: conf.isZoom || false
    });
    feature.feature.isPass = isPass;

    //绑定Infowindow
    //  feature.bindPopup(currentThis._getIframe(isPass ? (conf.json.passInfo || "D_Building") : conf.json.defaultInfo, feature.feature.properties), {
    //TODO 需要对YULIU3做定义，换个名字
    //  var resourceId = feature.feature.properties.RESOURCEID || conf.info;
    var resourceId = conf.info;


    feature.on("mouseout", function (e) {
        var _this = e.target;;
        mouseoutFuc.call(this, e);
        if(conf.isCalibration){
            VitoGIS._getEvents().Events.fire("FEATUREMOUSEOUT", _this); //必须与框架使用同一个E
        }
    }, context)

    feature.on("popupopen", function (e) {
        if(context.conf.isCalibration){ // 是否启用校正模式
            currentThis._setIframe(resourceId, e.target.feature.properties, "calibratePage",this);
        }else{
            currentThis._setIframe(resourceId, e.target.feature.properties, (isPass ? "passPage" : "defaultPage"),this);
        }
    });

    feature.on("popupclose", function (e) {
        //解决点击后颜色变化的问题
        mouseoutFuc.call(this, e);
        e.target.on("mouseout", function (e) {
            mouseoutFuc.call(this, e);
        }, this)
        e.target.on("mouseover", function (e) {
            mouseoverFuc.call(this, e);
        }, this)
        if (!this.conf.isZoom) {
            e.target.bindLabel(e.target.feature.properties[conf.labelField] || "", {
                offset: offset,
                direction: "auto",
                noHide: this.conf.isZoom || false
            });
        }
    }, context)

    feature.on("click", function (e) {
        if (e.target.feature)
            e.properties = e.target.feature.properties;
        this.currentThis.Events.fire("FEATURECLICK", e);
    }, currentThis)
    feature.on("dblclick", function (e) {
        if (e.target.feature)
            e.properties = e.target.feature.properties;
        this.currentThis.Events.fire("FEATUREDBCLICK", e);

    }, currentThis)
    if (!conf.isListen || !conf.info) {
        //TODO : 这块以后优化吧,现在不想整
    } else {
        feature.bindPopup(currentThis._getIframe(resourceId, feature.feature.properties, (isPass ? "passPage" : "defaultPage")), {
            maxWidth: 800,
            maxHeight: 800,
            autoPanPadding: [50, 130],
            className: "info"
        })

        feature.on("click", function (e) {
            e.target.removeEventListener("mouseover mouseout");
            if (!this.conf.isZoom)
                e.target.unbindLabel();
            currentThis._setInfo(e.target);
            e.target[method](this.overStyle);
        }, context)
    }
    //此处监听要素右键事件
    feature.on("contextmenu", function (e) {
        this.currentThis.Events.fire("RIGHTCLICK", e);
    }, currentThis)

    feature.addTo(this.currentLayer, id);
}

/*
* FeatureMouseOver
* */
VitoGIS.MapHandler.prototype._changeHighLight = function(target) {
    if (overStyle.options && target.feature.overIconUrl)
        overStyle.options.iconUrl = target.feature.overIconUrl;
    target["setStyle"](overStyle);
    target._showLabel({latlng:target.getCenter()});
}

/*
* FeatureMouseOut
* */
VitoGIS.MapHandler.prototype._changedefault = function(target){
    target["setStyle"](_defaultStyle);
    target._hideLabel();
}

/**
 * 要素添加到图层
 * 图层默认需要在feature.properties 中须有 SHENHE 字段 Value 为 1 or 0 用来定义，两中状态，
 * INCOLOR 字段， INCOLOR 字段定义每个要素显示的颜色（针对面要素）.
 * @method addToMap
 * @param {[Object]} options 添加进入图层的一些参数
 * @param {[Object]} features 一组要素
 * @param {[FeatureGroup]} layer 要素需要填的进的图层
 * */
VitoGIS.MapHandler.prototype.addToMap = function (options, features, layer) {
    //TODO 图层显示无法个性化
    //TODO InfoWindow没有配置上
    var currentLayer,
        method = "",
        currentThis = this,
        conf = options,
        passStyle = {},
        offset = [12, -15],
        context;
        overStyle = {};
        _defaultStyle = {};
    if (layer) {
        currentLayer = layer;
    }
    else {
        currentLayer = this.resultLayer;
    }
    //  currentLayer.clearLayers();
    switch (conf.geoType) {
        case "point":
            _defaultStyle = new L.icon(conf.defaultStyle);
            passStyle = new L.icon(conf.passStyle);
            overStyle = new L.icon(conf.passStyle);
            offset = [20, -35];
            method = "setIcon";
            context = {
                defaultStyle: _defaultStyle,
                passStyle: passStyle,
                overStyle: overStyle,
                offset: offset,
                method: method
            }
            break;
        case "polygon":
        case "polyline":
            _defaultStyle = conf.defaultStyle;
            passStyle = conf.passStyle;
            overStyle = {fillOpacity: 0.5, opacity: 0.5, fillColor: "#ffffff"};
            method = "setStyle";
            context = {
                defaultStyle: _defaultStyle,
                passStyle: passStyle,
                overStyle: overStyle,
                method: method
            }
            break;
    }
    context.currentLayer = currentLayer;
    context.currentThis = this;
    for (var index in features) {
        if (!currentLayer.hasLayer(features[index]))
            this._featureEventHandler.call(context, features[index], conf, index);
    }
    if (options.isZoom) {
        this.map.fitBounds(currentLayer.getBounds());

    }
    return currentLayer;
}


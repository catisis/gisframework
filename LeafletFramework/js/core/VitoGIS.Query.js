/**
 * 图层管理模块
 * @module VitoGIS.LayerManager
 * */


/**
 * 查询类
 * @class VitoGIS.Query
 * @extends VitoGIS.MapHandler
 */
VitoGIS.Query = function (_this, resultLayer) {
    VitoGIS.MapHandler.call(this, _this);
    if (resultLayer)
        this.resultLayer = resultLayer;
    this.map = _this.map;
    this.contexts = {};
    this.configManager = _this.configManager;

}

VitoGIS.inherit(VitoGIS.Query, VitoGIS.MapHandler);

/**
 * 通过一个矩形进行查询，适用于Supermap
 * @method queryByBounds
 * @private
 * @param {[String]} url 查询服务地址
 * @param {[Array]} params [{where:fieldName in (102),tableName:tableName+"@"+dataName}]
 * @param {[Bounds]} bounds 矩形
 * @param {[Array?]} data {conf:配置文件,queryMode:查询模式}
 * @param {[layer?]} layer 需要添加进的图层，可选字段
 * */
VitoGIS.Query.prototype.queryByBounds = function (options, params, featureLayer, callback) {
    var queryParams = [{
        where: params.where || "",
        tableName: params.tableName
    }]
    if (!params.geom) {
        params.queryMode = "SqlQuery";
    }
    if (params.bounds) {
        params.queryMode = "BoundsQuery";
        params.geom = params.bounds;
    }
    var query = new L.SupermapQuery({
        queryMode: params.queryMode || "SpatialQuery",// "BoundsQuery"
        distance: params.distance || null,
        spatialRealation: params.spatialRealation,
        params: queryParams,
        bounds: params.geom || null,
        isInnerTransform: false
    });
    if (params.isZoom == true) {
        options.isZoom = true;
    } else {
        options.isZoom = false;
    }
    if (!callback) {
        callback = function (a) {
            var contexts = {};
            contexts.conf = options;
            this.addToMap(options, a._layers, featureLayer);
        }
    }
    query.get(options.url, callback, this);
}
/**
 * 通过Where查询OGC图层
 * @private
 * @method queryByWhere
 * @param {[String]} url 查询服务地址
 * @param {Object]} params {geom:geometry ,where:where,spatialRealation:空间关系,tableName:tableName,nameSpace:nameSpace}
 * @param {[Array]} data {crs:当前配置}
 * */
VitoGIS.Query.prototype.queryByWhere = function (options, params, featureLayer, callback) {
    // isInnerTransform = isInnerTransform || false;
    var filter = new L.Where({
        geometry: params.geom,
        bounds: params.bounds,
        where: params.where,
        spatialRelation: params.spatialRelation,
        geom_field: params.geom_field,
        crs: L.CRS[options.crs]
    })
    var query = new L.WFSQuery({
        typeNS: params.nameSpace,
        typeName: params.tableName,
        crs: L.CRS[options.crs],
        filter: filter,
        fields: options.fields || [],
        isInnerTransform: false
    });
    if (params.isZoom == true) {
        options.isZoom = true;
    } else {
        options.isZoom = false;
    }
    if (!callback) {
        callback = function (features) {
            this.addToMap(options, features, featureLayer);
        }
    }
    query.get(options.url, callback, this)
}

VitoGIS.Query.prototype.queryByEsriHandler = function (options, params, featureLayer, callback) {

    var query = new L.EsriQuery({
        url: options.url
    });
    if (params.where)
        query = query.where(params.where);
    if (params.bounds)
        query = query.intersects(params.bounds);
    if (params.spatialRealation) {
        switch (params.spatialRealation) {
            case "CONTAIN":
                query = query.contains(params.geom);
                break;
            case "INTERSECT":
                query = query.intersects(params.geom);
                break;
            case "OVERLAP":
                query = query.overlaps(params.geom);
                break;
            case "WITHIN":
                query = query.within(params.geom);
                break;
        }
    }

    if (!callback) {
        callback = function (features) {
            this.addToMap(options, features, featureLayer);
        }
    }
    query.doQuery(function (a, b, d) {

        callback.call(this, b._layers);
    }, this);
}

/**
 * #12 缩放到点集合,并添加infowindow，依赖resultLayer图层
 * @method zoomToPoints
 * @param {[Array]} points 点集合 [[1,2],[1,2]]
 * @param {[Array]} labels 需要显示的Label[["a"],["b"]]于points顺序对应
 * @param {[String]} content infowindow中的内容
 * @param {[Object]} markOptions 点的参数
 * @param {[Object]} layer 点添加到的图层
 * @param {[Boolean]} flag 是否执行fitBounds函数
 *
 *
 * ###icon:
 * L.Icon    *    Icon class to use for rendering the marker. See Icon documentation for details on how to customize the marker icon. Set to new L.Icon.Default() by default.
 *
 * ###clickable:
 * Boolean    true    If false, the marker will not emit mouse events and will act as a part of the underlying map.
 *
 * ###draggable:
 * Boolean    false    Whether the marker is draggable with mouse/touch or not.
 *
 * ###keyboard:
 * Boolean    true    Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
 *
 * ###title:
 * String    ''    Text for the browser tooltip that appear on marker hover (no tooltip by default).
 *
 * ###alt:
 * String    ''    Text for the alt attribute of the icon image (useful for accessibility).
 *
 * ###zIndexOffset:
 * Number    0    By default, zIndex for the marker image is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like 1000 (or high negative value, respectively).
 *
 * ###opacity:
 * Number    1.0    The opacity of the marker.
 *
 * ###riseOnHover:
 * Boolean    false    If true, the marker will get on top of others when you hover the mouse over it.
 *
 * ###riseOffset:
 * Number    250    The z-index offset used for the riseOnHover feature.
 *
 *
 * */
VitoGIS.Query.prototype.zoomToPoints = function (points, lables, content, markOptions,layer, flag) {
    var resultLayer = layer || this.resultLayer;
    var options = {};
    if (markOptions) {
        options = markOptions;
    }
    for (var index in points) {
        var mark = new L.Marker(points[index], options);
        if (content)
            mark.bindPopup(content, {maxWidth: 500, maxHeight: 500, className: "info"});
        if (lables)
            mark.bindLabel(lables[index], {offset: [12, -15], noHide: true});

        mark.addTo(resultLayer);
    }
    if(flag) {
        this.map.fitBounds(resultLayer.getBounds());
    }

}
/**
 * 通过WKT定位
 * @method zoomToWKT
 * @example
 *      VitoGIS.init('../gis/conf/conf_dy.json',function(e) {
 *   	    window["gis"] = e;
 *      });
 *      var features =
 *      [
 *        {
 *          wkt: "POINT (0.143761589359332 0.0976874594118543)",
 *          attr: {
 *               id: 40194,
 *               poiUrl: {
 *                 def: "../../common/poi/people_def.png",
 *                 over: "../../common/poi/people_over.png",
 *                 pass: "../../common/poi/people_pass.png"
 *                },
 *                title: '测试'
 *          }
 *        }
 *      ];
 *      gis.query.zoomToWKT(features);
 *
 * @params {Array} features 包含要素和属性信息
 *
 *
 *      [
 *        {
 *          wkt: "POINT (0.143761589359332 0.0976874594118543)",
 *          attr: {
 *               id: 40194,
 *               poiUrl: {
 *                 def: "../../common/poi/people_def.png",
 *                 over: "../../common/poi/people_over.png",
 *                 pass: "../../common/poi/people_pass.png"
 *                },
 *                title: '测试'
 *          }
 *        },
 *        {
 *          wkt: "",
 *          attr: {
 *
 *          }
 *        }
 *      ]
 * @params {String} info 面板信息
 * @return {bool} 是否成功
 * */
VitoGIS.Query.prototype.zoomToWKT = function (features, info, isZoom) {
    isZoom = isZoom == false ? false : true
    var result = [];
    var isLocate = true;
    if (!features[0].wkt)
        isLocate = false;
    var geoType = features[0].wkt.substr(0, features[0].wkt.indexOf("(")).toLowerCase() || "";
    geoType = geoType.replace(/(^\s+)|(\s+$)/g, "");

    for (var f in features) {
        //判断是否存在feature
        if (!features[f]) {
            isLocate = false;
            continue;
        }
        //判断是否存在空间要素
        if (!features[f].wkt) {
            isLocate = false;
            continue;
        }
        if (features[f].wkt && geoType == "") {
            geoType = features[0].wkt.substr(0, features[0].wkt.indexOf(" (")).toLowerCase()
        }
        var wkt = new Wkt.Wkt();
        wkt.read(features[f].wkt);
        var feature = wkt.toObject();
        feature.feature = {};
        for (var i in features[f].attr["poiurl"]) {
            var field = i + "icon";
            features[f].attr[field.toUpperCase()] = features[f].attr["poiurl"][i];
        }
        feature.feature.properties = features[f].attr;
        result.push(feature);

    }
    var options = {};
    if (geoType == 'point') {
        options = {
            "geoType": "point",
            "isZoom": isZoom,
            "info": info,
            "labelField": "title",
            "isListen": true,
            "defaultStyle": {
                "iconUrl": "image/poi/default-DJ_Organizationwork.png",
                "iconSize": [44, 33],
                "iconAnchor": [22, 32],
                "popupAnchor": [0, -30]
            },
            "passStyle": {
                "iconUrl": "image/poi/default-DJ_Organizationwork.png",
                "iconSize": [44, 33],
                "iconAnchor": [22, 32],
                "popupAnchor": [0, -30]
            },
        }
    } else if (geoType == 'polygon') {
        options = {
            "geoType": "polygon",
            "isZoom": isZoom,
            "info": info,
            "isListen": true,
            "labelField": "title",
            "defaultStyle": {
                "fillOpacity": 0.5,
                "opacity": 0.1,
                "fillColor": "#CD4F39"
            },
            "passStyle": {
                "fillOpacity": 0.5,
                "opacity": 0.1,
                "fillColor": "#CD4F39"
            }
        }
    } else if (geoType == 'polyline' || geoType == 'linestring') {
        options = {
            "geoType": "polyline",
            "isZoom": isZoom,
            "info": info,
            "labelField": "title",
            "isListen": true,
            "defaultStyle": {
                "fillOpacity": 0.5,
                "opacity": 1,
                "fillColor": "#CD4F39"
            },
            "passStyle": {
                "fillOpacity": 0.5,
                "opacity": 1,
                "fillColor": "#CD4F39"
            }
        }
    }

    this.addToMap(options, result);
    return isLocate;

}
/**
 * 初始化配置文件当中的图层
 * @method loadLayers
 * @params {[Object]} featureLayerConf 需要载入的配置文件
 * */
VitoGIS.Query.prototype.loadLayers = function (featureLayerConf) {
    // this.self = self;

    // 初始化清除所有图层
    if (this.currentThis)
        this.currentThis.layerManager.cleanAll();
    // 初始化清除所有事件
    this.offAllAutoQuery();
    if (!featureLayerConf)
        featureLayerConf = this.configManager.getFeatureLayersConf()
    for (var layerIndex in featureLayerConf) {
        if (!featureLayerConf[layerIndex].visible) {
            continue;
        }
        var currentConf;
        var counter = 0;
        for (var featureIndex in featureLayerConf[layerIndex].layers) {
            var layerGroup = this.map._layers[featureLayerConf[layerIndex].id];
            currentConf = featureLayerConf[layerIndex].layers[featureIndex];
            if (!currentConf.visible) {
                continue;
            }
            //判断图层中是否有当前需要添加的layer
            if (!layerGroup) {
                layerGroup = new L.LayerGroup();
                layerGroup.id = featureLayerConf[layerIndex].id;
                layerGroup.addTo(this.map, featureLayerConf[layerIndex].id)
            }
            this._layerRequestDispatcher(currentConf, layerGroup);
            counter++;
        }
        if (counter == 0) {
            currentConf = featureLayerConf[layerIndex];
            this._layerRequestDispatcher(currentConf);
        }
    }
}
VitoGIS.Query.prototype._layerRequestDispatcher = function (currentConf, continer) {
    var featureLayer = this.map._layers[currentConf.id];
    //判断图层中是否有当前需要添加的layer
    if (!featureLayer) {
        featureLayer = new L.FeatureGroup();
        featureLayer.id = currentConf.id;
        featureLayer.addTo(continer || this.map, currentConf.id)
    }
    //赋值给全局变量
    this._currentLayerId = currentConf.id;

    if (currentConf.auto) {
        var context = {
            currentConf: currentConf,
            featureLayer: featureLayer,
            self: this
        }
        this.currentConf = currentConf;
        this.featureLayer = featureLayer;

        this.contexts[currentConf.id] = context;
        this._autoQueryHandler.call(context);
        this.map.on("dragend zoomend", this._autoQueryHandler, context);
    } else {
        var params = {where: currentConf.filter, tableName: currentConf.tableName};
        this.doQuery(currentConf, params, featureLayer);
    }
}
/**
 * 对自动查询图层进行处理
 * @method _autoQueryHandler
 * @private
 * */
VitoGIS.Query.prototype._autoQueryHandler = function (e) {
    if (!e || !e.target)
        e = {target: this.self.map};
    // this.featureLayer.clearLayers();
    if (e.target.getZoom() >= this.currentConf.minZoom && e.target.getZoom() < this.currentConf.maxZoom) {
        var params = {where: this.currentConf.filter, bounds: e.target.getBounds()};
        this.self.doQuery(this.currentConf, params, this.featureLayer);
    } else {
        this.featureLayer.clearLayers();
    }
}
/**
 * 移除自动查询事件
 * @method offAutoQuery
 * @params {[String]} id 移除的图层id
 * */
VitoGIS.Query.prototype.offAutoQuery = function (id) {
    if (!this.contexts)
        return;
    this.map.off("dragend zoomend", this._autoQueryHandler, this.contexts[id]);
    this.contexts[id] = null;
}
/**
 * 移除所有自动查询事件
 * @method offAllAutoQuery
 * */
VitoGIS.Query.prototype.offAllAutoQuery = function () {
    var layerConf = this.configManager.getFeatureLayersConf();
    for (var layerIndex in layerConf) {
        this.offAutoQuery(layerIndex);
        for (var j in layerConf[layerIndex].layers) {
            this.offAutoQuery(j);
        }
    }
}
/**
 * 查询方法,暂时支持超图和OGC WFS图层查询
 * @method doQuery
 * @params {[Object]} options 图层参数
 *
 *  serverType: "Supermap" || "OGC",
 *
 *
 *  url: "http://192.168.0.191:8091/iserver/services/map-instance/rest/maps/DY25/queryResults.jsonp",
 *
 *  tableName: "TestPolygon@SUPERMAP_DY",
 *
 *   nameSpace: "postgis",
 *
 *  defaultInfo: "view",
 *
 *  passInfo: "DJ_Party",
 *
 *  geoType: "polygon",
 *
 *  crs: "UNKNOWN", || GCJ02
 *
 *  defaultStyle: {
 *
 *      fillOpacity: 0,
 *
 *      opacity: 0.1,
 *
 *      fillColor: "#CD4F39"
 *
 *   },
 *
 *      passStyle: {
 *
 *      fillOpacity: 0,
 *
 *      opacity: 0.1,
 *
 *      fillColor: "#000000"
 *
 *   }
 * @params {[Object]} params 查询参数
 *
 *   where: params.where,
 *
 *   geom: params.geom || null,
 *
 *   bounds: params.bounds || null,
 *
 *   spatialRealation: params.spatialRealation || null,
 *
 *   isZoom:false //是否缩放到图层
 *
 * @params {[L.FeatureGroup]} featureLayer
 * @params {[Function]} callback
 * */
VitoGIS.Query.prototype.doQuery = function (options, params, featureLayer, callback, context) {
    //TODO OGC查询无法只返回属性信息
    this.context = context;
    if (!params)
        return;
    var queryParams = {
        tableName: options.tableName,
        nameSpace: options.nameSpace,
        geom_field: options.geom_field || null,
        where: params.where,
        geom: params.geom || null,
        bounds: params.bounds || null,
        spatialRealation: params.spatialRealation || null,
        isZoom: params.isZoom || false
    }
    switch (options.serverType) {
        case "OGC":
            this.queryByWhere(options, queryParams, featureLayer, callback)
            break;
        case "Supermap":
            this.queryByBounds(options, queryParams, featureLayer, callback);
            break;
        case "Arcgis":
            this.queryByEsriHandler(options, queryParams, featureLayer, callback);
            break;
    }
}

//VitoGIS.query = new VitoGIS.Query();
//VitoGIS.query.loadLayers();
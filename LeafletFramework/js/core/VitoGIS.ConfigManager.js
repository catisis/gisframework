/**
 基础模块

 @module MapBaseModule
 */
/**
 * Created by bk on 2015/9/10.
 * 配置文件集中管理类，对配置文件集中控制，使其更为安全。
 * @Class VitoGIS.ConfigManager
 */
VitoGIS.ConfigManager = function (conf) {
    /**
     * 初始化地图配置文件
     * @private
     * @method _confFix
     * @params {Object} conf.json 配置
     * */
    var _confFix = function (conf) {
        for (var i in conf.baseLayerConf) {
            conf.baseLayerConf[i].id = i;
            conf.baseLayerConf[i].title = conf.baseLayerConf[i].title || "默认地图";
            conf.baseLayerConf[i].mapUrl = conf.baseLayerConf[i].mapUrl || "http://192.168.0.191:8091/iserver/services/map-instance2/rest/maps/correct/tileImage.png?transparent=true&cacheEnabled=false&width=256&height=256&x={x}&y={y}&scale={sm}&redirect=false";
            conf.baseLayerConf[i].labelUrl = conf.baseLayerConf[i].labelUrl || ""; //http://192.168.0.191:8091/iserver/services/map-instance2/rest/maps/map25/tileImage.png?transparent=false&cacheEnabled=true&width=256&height=256&x={x}&y={y}&scale={sm}&redirect=false
            conf.baseLayerConf[i].subdomains = conf.baseLayerConf[i].subdomains || ["01", "02", "03", "04"];
            conf.baseLayerConf[i].maxZoom = conf.baseLayerConf[i].maxZoom || 18;
            conf.baseLayerConf[i].minZoom = conf.baseLayerConf[i].minZoom || 11;
            conf.baseLayerConf[i].crs = conf.baseLayerConf[i].crs || "UNKNOWN";
            // conf.json.baseLayerConf[i].visible = conf.json.baseLayerConf[i].visible ;
            conf.baseLayerConf[i].center = conf.baseLayerConf[i].center || [0.4299787022625365, 1.029235094459695];
            conf.baseLayerConf[i].initLevel = conf.baseLayerConf[i].initLevel || 15;
            conf.baseLayerConf[i].tileSize = conf.baseLayerConf[i].tileSize || 256;
            if (conf.baseLayerConf[i].detectRetina && conf.baseLayerConf[i].detectRetina == true) {
                conf.baseLayerConf[i].detectRetina = true;
            } else {
                conf.baseLayerConf[i].detectRetina = false;
            };
        }
        for (var j in conf.featureLayersConf) {
            conf.featureLayersConf[j].id = j;
            conf.featureLayersConf[j].serverType = conf.featureLayersConf[j].serverType || "OGC";
            conf.featureLayersConf[j].url = conf.featureLayersConf[j].url || "http://192.168.0.199:8091/geoserver/postgis/ows";
            conf.featureLayersConf[j].editUrl = conf.featureLayersConf[j].editUrl || "http://192.168.0.191:8091/iserver/services/data-instance/rest/data/datasources/SUPERMAP_DY/datasets/D_Building/features.jsonp";
            conf.featureLayersConf[j].tableName = conf.featureLayersConf[j].tableName || "DJ_Party";
            conf.featureLayersConf[j].nameSpace = conf.featureLayersConf[j].nameSpace || "postgis";
            conf.featureLayersConf[j].defaultInfo = conf.featureLayersConf[j].defaultInfo || "view";
            conf.featureLayersConf[j].passInfo = conf.featureLayersConf[j].passInfo || "DJ_Party";
            conf.featureLayersConf[j].labelField = conf.featureLayersConf[j].labelField || "NAME";
            //   conf.json.featureLayersConf[j].visible = conf.json.featureLayersConf[j].visible || false;
            conf.featureLayersConf[j].title = conf.featureLayersConf[j].title || "党组织";
            conf.featureLayersConf[j].geoType = conf.featureLayersConf[j].geoType || "point";
            conf.featureLayersConf[j].resource = conf.featureLayersConf[j].resource || "djxt_dzzgl1";
            conf.featureLayersConf[j].crs = conf.featureLayersConf[j].crs || "GCJ02";
            conf.featureLayersConf[j].maxZoom = conf.featureLayersConf[j].maxZoom || 18;
            conf.featureLayersConf[j].minZoom = conf.featureLayersConf[j].minZoom || 15;
            conf.featureLayersConf[j].isListen = typeof(conf.featureLayersConf[j].isListen) == "undefined" ? true : conf.featureLayersConf[j].isListen;
            conf.featureLayersConf[j].defaultStyle = conf.featureLayersConf[j].defaultStyle || {
                    iconUrl: "../image/poi/defaultdang.png",
                    iconSize: [44, 33],
                    iconAnchor: [22, 32],
                    popupAnchor: [0, -30]
                };
            conf.featureLayersConf[j].passStyle = conf.featureLayersConf[j].passStyle || {
                    iconUrl: "../image/poi/dang.png",
                    iconSize: [44, 33],
                    iconAnchor: [22, 32],
                    popupAnchor: [0, -30]
                };
            //conf.json.featureLayersConf[j].filter = conf.json.featureLayersConf[j].filter || "SHENHE in (1)";
            //         conf.json.featureLayersConf[j].auto = conf.json.featureLayersConf[j].auto || true;
            conf.featureLayersConf[j].netSP = conf.featureLayersConf[j].netSP || "http://www.baidu.com";

            if (!L.Util.isArray(conf.featureLayersConf[j].passStyle.iconSize)) {
                conf.featureLayersConf[j].passStyle.iconSize = L.Util.objToArray(conf.featureLayersConf[j].passStyle.iconSize)
            }
            if (!L.Util.isArray(conf.featureLayersConf[j].passStyle.iconAnchor)) {
                conf.featureLayersConf[j].passStyle.iconAnchor = L.Util.objToArray(conf.featureLayersConf[j].passStyle.iconAnchor)
            }
            if (!L.Util.isArray(conf.featureLayersConf[j].passStyle.popupAnchor)) {
                conf.featureLayersConf[j].passStyle.popupAnchor = L.Util.objToArray(conf.featureLayersConf[j].passStyle.popupAnchor)
            }

            if (!L.Util.isArray(conf.featureLayersConf[j].defaultStyle.iconSize)) {
                conf.featureLayersConf[j].defaultStyle.iconSize = L.Util.objToArray(conf.featureLayersConf[j].defaultStyle.iconSize)
            }
            if (!L.Util.isArray(conf.featureLayersConf[j].defaultStyle.iconAnchor)) {
                conf.featureLayersConf[j].defaultStyle.iconAnchor = L.Util.objToArray(conf.featureLayersConf[j].defaultStyle.iconAnchor)
            }
            if (!L.Util.isArray(conf.featureLayersConf[j].defaultStyle.popupAnchor)) {
                conf.featureLayersConf[j].defaultStyle.popupAnchor = L.Util.objToArray(conf.featureLayersConf[j].defaultStyle.popupAnchor)
            }


        }
        return conf;
    }

    conf = _confFix(conf);
    var baseLayerConf, featureLayersConf, widgetsConf, divConf,
        innerFunc = function (conf) {
            baseLayerConf = conf.baseLayerConf;
            featureLayersConf = conf.featureLayersConf;
            divConf = conf.divConfig;
            widgetsConf = conf.widgetsConfig;
        };
    innerFunc.prototype = {
        /***
         * 获取底图配置文件
         * @method getBaseLayerConf
         * @return baseLayerConf
         * */
        getBaseLayerConf: function () {
            return baseLayerConf;
        },
        /***
         * 设置底图配置文件
         * @method setBaseLayerConf
         * */
        setBaseLayerConf: function (value) {
            baseLayerConf = value;
        },
        /***
         * 获取业务图层配置文件
         * @method getFeatureLayersConf
         * @return featureLayersConf
         * */
        getFeatureLayersConf: function () {
            return this._clone(featureLayersConf, {});
        },
        /***
         * 获取业务图层配置文件,并将Visible属性置为false
         * @method getInvisibleFLayaersConf
         * @return featureLayersConf
         * */
        getInvisibleFLayaersConf: function () {
            var conf = this.getFeatureLayersConf();
            for (var item in conf) {
                if (conf[item].layers) {
                    for (var per in conf[item].layers) {
                        conf[item].layers[per].visible = false;
                    }
                }
                else {
                    conf[item].visible = false;
                }
            }
            return conf;
        },
        /***
         * 获取业务图层配置文件
         * @method getFeatureLayerConf
         * @params {[String]} id 需要获取业务图层的id
         * @return featureLayersConf
         * */
        getFeatureLayerConf: function (id, loopConf) {
            var innerConf = loopConf || featureLayersConf;
            for (var item in innerConf) {
                if (innerConf[item].layers) {
                    var result = this.getFeatureLayerConf(id, innerConf[item].layers);
                    if (result)
                        return result
                }
                if (innerConf[item].id == id) {
                    var proto = {};
                    return this._clone(innerConf[item], proto);
                }

                // else return null;
            }
        },
        /***
         * 设置业务图层配置文件
         * @method setFeatureLayersConf
         * */
        setFeatureLayersConf: function (value) {
            featureLayersConf = value;
        },
        /***
         * 获取组件配置文件
         * @method getFeatureLayerConf
         * @return widgetsConf
         * */
        getWidgetsConf: function () {
            return widgetsConf;
        },
        /***
         * 设置组件配置文件
         * @method setWidgetsConf
         * */
        setWidgetsConf: function (value) {
            widgetsConf = value;
        },
        /***
         * 获取弹出窗配置文件
         * @method getDivConf
         * @return divConf
         * */
        getDivConf: function () {
            return divConf;
        },
        /***
         * 设置弹出窗配置文件
         * @method setDivConf
         * */
        setDivConf: function (value) {
            divConf = value;
        },
        _clone: function (source, proto) {
            for (var p in source) {
                if (!proto.hasOwnProperty(p)) {
                    if(Object.prototype.toString.call(source[p]) === "[object Object]") {
                        proto[p] = this._clone(source[p], {});
                    } else {
                        proto[p] = source[p];
                    }
                }
            }
            return proto;
        }

    }
    return new innerFunc(conf);

}

VitoGIS.ConfigManager.prototype = {}

/**
 基础模块

 @module MapBaseModule
 */

/**
 * 初始化地图
 * @class VitoGis.MapManager
 * @constructor
 * @extends VitoGIS.ConfigManager
 * */
/**
 * 构造函数
 *
 * @method VitoGIS.MapManager
 * @params {String} container 容器ID
 * @params {Object} conf 配置文件
 * @params {Object} _this 当前的初始化组件环境
 * */
VitoGIS.MapManager = function (container, conf, _this) {
    this.configManager = VitoGIS.ConfigManager.call(this, conf);
    //this.currentThis = target;
    this.container = container;
    if (!this.container)
        this.container = "map";

    // var proto = VitoGIS.Proto.call(this);

    var getRes = function (orgin) {
        var returnCrs = new L.Proj.CRS('EPSG:900913',
            '+title=Google Mercator EPSG:900913 +proj=merc +ellps=WGS84 +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
            {
                resolutions: function () {
                    level = 25
                    var res = [];
                    res[0] = 156543.033928;
                    for (var i = 1; i < level; i++) {
                        res[i] = res[i - 1] / 2;
                    }
                    return res;
                }(),
                origin: orgin
            });
        returnCrs.innerTransform = L.CRS.UNKNOWN.innerTransform;
        return returnCrs;
    }

    var baseLayersConf = this.configManager.getBaseLayerConf();
    for (var index in baseLayersConf) {
        if (baseLayersConf[index].visible) {
            if (baseLayersConf[index].crs)
                this.crs = L.Util.isArray(baseLayersConf[index].crs) ? getRes(baseLayersConf[index].crs) : L.CRS[baseLayersConf[index].crs];
            else {
                this.crs = L.CRS.UNKNOWN;
            }
            this._currentBaseLayerConf = baseLayersConf[index];
        }
    }
    var map = new L.Map(this.container, {
        crs: this.crs,
        continuousWorld: true,
        worldCopyJump: false,
        zoomControl: false,
        doubleClickZoom: false
    });
    map.on("IDCHANGE", function (id) {
        _this._currentLayerId = id.name
    })

    map.on("dblclick", function (e) {
        _this.Events.fire("MAPDBCLICK", e);

    })
    map.on("click", function (e) {
        _this.Events.fire("MAPCLICK", e);

    })
    //  map.on("INFOOPEN", this._setInfo);
    map.on("zoomend", function (e) {
        var data = {
            zoom: e.target._zoom
        }
        _this.Events.fire("ZOOMCHANGE", data);
    });
    map.on("moveend", function (e) {
        _this.Events.fire("MOVECHANGE", e);
    });
    map.on("contextmenu", function (e) {
        _this.Events.fire("RIGHTCLICK", e);
    });
    map.on("mousemove", function (e) {
        _this.Events.fire("MAPMOUSEMOVE", e);
    });

    return {
        map: map,
        _currentBaseLayerConf: this._currentBaseLayerConf,
        configManager: this.configManager,
        crs: this.crs,
        getRes: getRes
    };
}
VitoGIS.inherit(VitoGIS.MapManager, VitoGIS.ConfigManager)
//VitoGIS.MapManager.prototype = new VitoGIS.Proto();
//VitoGIS.extend(new VitoGIS.MapManager());

///**
// * 事件类
// *
// * 使用方法：
// *
// *
// * 监听事件
// * VitoGIS.Events.on("ZOOMCHANGE",function(){})；
// *
// *
// * 分发事件
// * VitoGIS.Events.fire("ZOOMCHANGE",anaything)；
// * @class VitoGIS.Events
// * */

/**
 * 地图级别变化触发
 * @Event {[String]} ZOOMCHANGE
 *
 * */

/**
 * 地图级移动结束触发
 * @Event {[String]} MOVECHANGE
 *
 * */

/**
 * 地图鼠标右键
 * @Event {[String]} RIGHTCLICK
 *
 * */

/**
 * 绘制结束分发事件
 * @Event {[String]} DRAWEND
 *
 * */

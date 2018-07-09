/**
 地图框架

 Feartures :
 1. 实现地图的缩放，平移，漫游等基本功能
 2. 实现地图的查询，编辑等功能
 3. 实现地图查询，调用百度API

 @module MapFramework
 */


/**
 * 提供基础的地图方法
 * @class VitoGIS
 * @static
 * */


var VitoGIS = {
    /**
     * 当前要素,地图最后一次点击的要素
     * @Property _currentInfo
     *
     * */
    _currentInfo: {},
    /**
     * map组件
     * @Property map
     * */

    /**
     * 查询返回的的Layer
     * @Property resultLayer
     * */

    /**
     * 实现继承类
     * @private _object
     * */
    _object: function (o) {
        function F() {
        }
        F.prototype = o;
        return new F();
    },
    /**
     *
     * 实现继承
     * @method inherit
     * @private
     * @param {Object} subType 子类
     * @param {Object} superType 超类
     * */
    inherit: function (subType, superType) {
        var p = this._object(superType.prototype);
        p.constructor = subType;
        subType.prototype = p;
    },

    /**
     *  #9初始化方法,URL为可选参数默认访问当前目录父目录的conf.json文件
     * @method init
     * @param {[String||"?"]} url 配置文件的URL
     * @param {[Function||?]} callback 回调函数
     * @param {String} continerId 容器的id
     * */
    init: function (url, callback, continerId) {
        _method = {};
        //初始化基础参数
        this._initBaseOptions();
        url = url || this._path + "/../conf.json";
        //添加事件
        _method.Events = function () {
        };
        L.extend(_method.Events, L.Mixin.Events);

        if(url.length > 200) {
            var urlObj = JSON.parse(url);
            this._initByConf(_method,continerId,urlObj,callback,this)
        } else {
            //对默认不给配置文件时进行默认设置
            L.Request.get(url, "", function (error, conf) {
                this._initByConf(_method,continerId,conf,callback,this)
            }, this)
        }
    },
    /**
     * 当前图层id
     * @property
     * */
    _currentLayerId: "",

    _initBaseOptions: function () {
        var scripts = document.getElementsByTagName('script'),
            leafletRe = /[\/^]VitoGIS[\-\._]?([\w\-\._]*)\.js\??/;
        var i, len, src, matches, path;
        for (i = 0, len = scripts.length; i < len; i++) {
            src = scripts[i].src;
            matches = src.match(leafletRe);

            if (matches) {
                path = src.split(leafletRe)[0];
                break;
            }
        }
        this._path = path;
    },
    _initWidgets: function (method) {

        //widgetsConfig 添加进入 configManager
        var widgetsConfig = method.mapManager.configManager.getWidgetsConf();
        for (var index in widgetsConfig) {
            if (widgetsConfig[index].isUse) {
                //   var scriptMain = document.createElement("script");
                var confPath = widgetsConfig[index].widgetConf;
                //widgetsConfig[index]._path = this._path;
                L.Request.get(confPath, "", function (e, b, c, d) {
                    if (e) {
                        if (e.code == 500)
                            return;
                    }
                    method[this.id + "Conf"] = b;
                    if (this.widgetCSS) {
                        var css = document.createElement("link");
                        css.rel = "stylesheet";
                        css.href = this.widgetCSS;
                        document.getElementsByTagName("HEAD")[0].appendChild(css);
                    }
                    //if (L.Browser.chrome) {
                    var script = document.createElement("script");
                    script.setAttribute("type", "text/javascript");
                    document.getElementsByTagName("HEAD")[0].appendChild(script);
                    var id = this.id;
                    //兼容性考虑
                    if (L.Browser.ie) {
                        script.onreadystatechange = function () {
                            if (this.readyState == "loaded" || this.readyState == "complete") {
                                if (id) {
                                    method[id.toLowerCase()] = new VitoGIS[id](method);
                                    method.Events.fire(id.toUpperCase(), method[id.toLowerCase()]);
                                }

                            }
                        }
                    } else {
                        script.onload = function () {
                            if (id) {
                                method[id.toLowerCase()] = new VitoGIS[id](method);
                                method.Events.fire(id.toUpperCase(), method[id.toLowerCase()]);
                            }

                        }
                    }
                    script.setAttribute("src",this.widgetUrl);
                    //}


                }, widgetsConfig[index])
            }
        }
    },
   /**
    * 根据配置文件初始化地图
    * @param {Object} method
    * @param {String} continerId 容器的id
    * @param {Object} conf 地图配置变量
    * @param {[Function||?]} callback 回调函数
    * @param {Object} that
    */
    _initByConf: function(method,continerId,conf,callback,that){
        method.mapManager = new this.MapManager(continerId || "map", conf, method);
        //需要mapManager的初始化
        method.layerManager = new this.LayerManager(method);
        method.layerManager.loadBaseLayer();

        method.layerManager.loadLayers(null);
        //需要layerManager和mapManager的支持
        method.draw = new this.Transaction(method);

        /**
         *  返回中心点
         *  @method setCenter
         *
         * */
        method.setCenter = function (center) {
            method.mapManager.map.setView(center || method.layerManager._currentBaseLayerConf.center, method.layerManager._currentBaseLayerConf.initLevel);
        };

        //初始化组件
        that._initWidgets(method);
        if (callback)
            callback(method);
    },
    _getEvents: function(){
        return _method;
    }
};
//VitoGIS.LayerManager = new VitoGIS.LayerManager.proto();

VitoGIS.extend = function (source) {
    for (var p in source) {
        if (!this.hasOwnProperty(p)) {
            this[p] = source[p];
        }
    }
    return this;
};

//VitoGIS.widgetConfig = widgetConfig;
//VitoGIS.divConfig = divConfig;




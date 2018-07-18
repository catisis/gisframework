/**
 基础模块

 @module MapBaseModule
 */


/**
 * 基类
 * @class VitoGIS.Proto
 */
VitoGIS.Proto = function (_this) {
    this.currentThis = _this;
}
VitoGIS.Proto.prototype = {

    extend: function (source) {
        for (var p in source) {
            if (!this.hasOwnProperty(p)) {
                this[p] = source[p];
            }
        }
        return this;
    },

    /**
     * 关闭InfoWindow
     *   @method closeInfo
     * */
    closeInfo: function () {

        if (this.currentThis._currentInfo) {
            this.currentThis.mapManager.map.closePopup(this.currentThis._currentInfo._popup);
        }
    },

    /**
     * 获取当前图层配置信息
     *  @method getCurrentLayerConf
     *  @return {[Object]} featureLayerConf 当前图层的配置信息
     *
     * */
    getCurrentLayerConf: function () {
        if (this._currentLayerId)
            return this.configManager.getFeatureLayersConf()[this._currentLayerId];
        else
            return null;
    },

    /**
     *  设置当前的点击目标
     *  @private
     *   @method _setInfo
     *
     * */
    _setInfo: function (info) {
        this.currentThis._currentInfo = info;
    },
    getCurrentInfo: function () {
        return this.currentThis._currentInfo;
    },

    /**
     *
     * 获取配置文件 divConfig 中的style
     * @method _getIframe
     * @private
     * @param {[String]} id 表名或者什么id
     * @return {[Object]} result  {
	 *		width : 600,
	 *		height : 450,
	 *		pageUrl : "/demolition/cq_project/Cq_Project.ht",
	 *		page : "../map/theme/template/template.html"
	 *	}
     * */
    _getIframe: function (id, params, type) {

        var moudle = "<div id='featureContainer'></div>";

        return moudle;
    },
    _setIframe: function(id, params, type,that) {
        var type = type || "defaultPage";
        var featureId = (params.ID || params.id || params.SMID) || new Date().getTime();
        var title = "";
        var paramsStr = "";
        if (params) {
            paramsStr = featureId;
        }
        var attributes = JSON.stringify(params);
        attributes = encodeURI(attributes);
        var currentDivConf = this.configManager.getDivConf()[id][type];
        if(currentDivConf.title){
            var starIndex = currentDivConf.title.indexOf("{")+1;
            var lastindex = currentDivConf.title.indexOf("}");
            var replase = currentDivConf.title.substring(starIndex,lastindex);

            title = currentDivConf.title.replace(("{"+replase+"}"),params[replase]);
        }

        var replace = {
            _width_: currentDivConf.width,
            _height_: currentDivConf.height,
            _title_: title,
            _featureId_: featureId,
            _url_: currentDivConf.url,
            _attributes_: attributes,
            _paramsStr_: encodeURI(paramsStr)
        };
        var featureContainer = document.getElementById("featureContainer");

        L.Request.getText(currentDivConf.panelFrame,"", function (err,data) {
                    var moudle = data;
                    for(var k in replace) {
                        var re = new RegExp (k,"g");
                        moudle = moudle.replace(re,replace[k]);
                    }
            that.setPopupContent(moudle);
        },that);
    },
    
    /**
     *  更新InfoWindow
     *  @method updateContent
     *  @param {[String]} id conf.json 下面的配置页面
     *  @param {[String]} pramas 需要传入的参数
     * */
    updateContent: function (id, pramas) {
        if (!this._currentInfo._popup) {
            this._currentInfo.bindPopup(this._getIframe(id, pramas), {
                maxWidth: 500,
                maxHeight: 500,
                className: "info"
            }).openPopup();
            //	this._currentInfo.addTo(layer).openPopup()
        }
        else {
            this._currentInfo._popup.setContent(this._getIframe(id, pramas));
        }

    }


}

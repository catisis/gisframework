VitoGIS.LZView = function (_this) {
};
VitoGIS.LZView.prototype = {
    doQueryArea: function () {
        var conf = VitoGIS.configManager.getFeatureLayerConf("Base_Org");
        conf.visible = true;
        conf.auto = false;

        var result = {};
        result["Base_Org"] = conf;

        parent.VitoGIS.query.doQuery(conf, {}, null, function (e) {

            VitoGIS.query.addToMap(this.context.conf, e)
        }, {result: "", conf: conf});
    },
    doQueryLable: function () {
        var conf = VitoGIS.configManager.getFeatureLayerConf("lab");
        conf.visible = true;
        conf.auto = false;

        var result = {};
        result["lab"] = conf;

        parent.VitoGIS.query.doQuery(conf, {}, null, function (e) {
            this.context.conf.isZoom = true;

            var myIcon = L.divIcon({className: 'my-div-icon',html:'<div>123</div>'});
            for(var i in e){
                e[i].setIcon(myIcon);
                e[i].feature.id = this.context.conf.id + e[i].feature.id;
                e[i].addTo(VitoGIS.drawLayer);
            }
            this.map.fitBounds(VitoGIS.drawLayer.getBounds());
          //  VitoGIS.map.
           // VitoGIS.query.addToMap(this.context.conf, e)

        }, {result: "", conf: conf});
    }
}

VitoGIS.lzView = new VitoGIS.LZView();
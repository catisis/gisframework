VitoGIS.DJ_Party = function () {
    $.get(document.location.origin + __ctx + "/portal/Base_Datas/GetCodeByType.ht", {typeName: "CoordinateType"},
        function (data) {
            var conf = VitoGIS.configManager.getFeatureLayersConf();
            $.each(data, function (index, value) {
                if (conf[value.pinyin])
                    conf[value.pinyin].typeId = value.id || "";
            });
            VitoGIS.configManager.setFeatureLayersConf(conf);
        }
    );
};

VitoGIS.DJ_Party.prototype = {};

VitoGIS.dj_party = new VitoGIS.DJ_Party();
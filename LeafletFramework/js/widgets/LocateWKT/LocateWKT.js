/**
 * Created by bk on 2017/5/22.
 */
/**
 * 通过WKT定位
 * @method LocateWKT
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
VitoGIS.LocateWKT = function (_this) {
    this.method = _this;
};

VitoGIS.LocateWKT.prototype = {
    locate: function(features, info, layer, isZoom) {
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
                    "opacity": 0.1,
                    "fillColor": "#CD4F39"
                },
                "passStyle": {
                    "fillOpacity": 0.5,
                    "opacity": 0.1,
                    "fillColor": "#CD4F39"
                }
            }
        }

        this.method.addToMap(options, result, layer);
        return isLocate;
    }
};
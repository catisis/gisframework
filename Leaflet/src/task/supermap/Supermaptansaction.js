/**
 * Created by bk on 2015/11/5.
 */
/**
 * @class L.SaveDraw
 * @params {[Object]} {
 *
 * outProj:"m" ����degree�� ������겻��ͶӰת��
 * }
 * */
L.SaveDraw = L.Class.extend({
    includes: [L.Mixin.Events, L.Request],
    options: {
        outProj: "m"

    }, initialize: function (options) {
        L.setOptions(this, options);
    },
    concent: {
        returnContent: true,
        _method: 'POST',
        requestEntity: {},
        sectionCount: 1,
        sectionIndex: 0
    },
    _toGeoString: function (featureGroup) {
        var updateJson = "[";
        for (var key in featureGroup) {
            var featureJson = "{"
            var feature = featureGroup[key];
            var geoType = feature.toGeoJSON().geometry.type;
            switch (geoType.toString()) {
                case "Polygon":
                    geoType = "REGION";
                    break;
                case "LineString":
                    geoType = "LINE";
                    break;
                case "Point":
                    geoType = "POINT";
                    break;
            }
            if (feature.feature.properties) {
                var fieldName = "'fieldNames':["
                var fieldValue = "'fieldValues':[";
                for (var n in feature.feature.properties) {
                    fieldName += "\"" + n + "\"" + ",";
                    fieldValue += "\"" + feature.feature.properties[n] + "\"" + ",";
                }
                fieldName += "],";
                featureJson += fieldName;

                fieldValue += "],"
                featureJson += fieldValue;
            }
            featureJson += "'geometry':{'id':" + (feature.feature.properties.SMID||+Date.parse(new Date())) + ",'style':null,'type':\"" + geoType + "\",'prjCoordSys':{'epsgCode':null},'parts':[";
            featureJson += geoType == "POINT" ? "1" : feature._latlngs.length;
            featureJson += "],";
            featureJson += "'points':["
            if (geoType == "POINT") {
                var temPoint = feature._latlng;
                if (this.options.outProj == "m") {
                    temPoint = L.Projection.Mercator.project(temPoint);
                }
                featureJson += "{'id':\"\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
            }
            else {
                if (geoType == "REGION") {
                    for (var i in feature._latlngs[0]) {
                        var temPoint = feature._latlngs[0][i];
                        if (this.options.outProj == "m") {
                            temPoint = L.Projection.Mercator.project(temPoint);
                        }
                        featureJson += "{'id':\"0\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
                    }
                }
            }

            featureJson += "]}";
            featureJson += "},";
            updateJson += featureJson;
        }
        updateJson += "]"
        return updateJson;
    },
    _bodyJoin: function (content, method) {
        var contentCount = Math.ceil(content.getLength() / 1000);
        var bodys = [];
        var timestamp = Date.parse(new Date());

        for (var index = 0; index < contentCount; index++) {
            var temContext = content.substring(index * 1000, (index * 1000) + 1000);

            bodys[index] = {
                returnContent: true,
                _method: method || 'POST',
                sectionCount: contentCount == 1 ? 1 : contentCount + 1,
                sectionIndex: index,
                requestEntity: temContext,
                jsonpUserID: timestamp
            };
        }
        if (contentCount > 1) {
            bodys.push({
                returnContent: true,
                _method: method || 'POST',
                sectionCount: contentCount + 1,
                sectionIndex: contentCount,
                jsonpUserID: timestamp
            });
        }
        return bodys;
    },
    /**
     * @method save
     * @params {[String]} url url
     * @params {[Array]} featureGroup Ҫ�ؼ�
     * @params {[callback]} callback �ص�����
     * @params {[Object]} context ����
     * */
    save: function (url, featureGroup, callback, context) {

        var str = this._toGeoString(featureGroup);
        var queryTask = this._bodyJoin(str);
        for (var times = 0; times < queryTask.length - 1; times++) {
            this.noReturnJP(url, queryTask[times])
        }

        var my = this.JSONP(url, queryTask[queryTask.length - 1], callback, context);
        console.log(my);
    },
    update: function (url, featureGroup, callback, context) {

        var str = this._toGeoString(featureGroup);
        var queryTask = this._bodyJoin(str, "PUT");
        for (var times = 0; times < queryTask.length - 1; times++) {
            this.noReturnJP(url, queryTask[times])
        }

        var my = this.JSONP(url, queryTask[queryTask.length - 1], callback, context);
        console.log(my);
    },
    /**
     * ids : [1,2,3,4]
     * */
    delete: function (url, ids, callback, context) {
        var myConcent = this.concent;
        myConcent._method = "DELETE";
        myConcent.requestEntity = ids;
        myConcent.ids = ids;
        var my = this.JSONP(url, myConcent, callback, context);
    }
})
/**
 * Created by bk on 2015/5/19.
 */
/**
 *
 * CONTAIN: “CONTAIN”,

 *  CROSS: “CROSS”,

 * DISJOINT: “DISJOINT”,

 * IDENTITY: “IDENTITY”,

 * INTERSECT: “INTERSECT”,

 * NONE: “NONE”,

 * OVERLAP: “OVERLAP”,

 * TOUCH: “TOUCH”,

 * WITHIN: “WITHIN”.
 */
L.SupermapQuery = L.Class.extend({
    includes: [L.Mixin.Events, L.Request],

    options: {
        // url:"http://192.168.0.191:8091/iserver/services/map-DY/rest/maps/DY25/queryResults.jsonp",
        //shenhe in ('1')
        //SpatialQuery
        //DistanceQuery
        distance: 2500,
        queryMode: "BoundsQuery",
        spatialRelation: "INTERSECT",
        params: [
            {
                tableName: "D_Building@SUPERMAP_DY",
                where: ""
            }
        ],
        bounds: null,
        expectCount: "100000",
        isInnerTransform: false,
        //m和degree
        outProj: "m"

    },

    _body: {
        content: "{'queryMode':'$queryMode$'," +
        "'queryParameters':" +
        "{'customParams':null," +
        "'expectCount':$expectCount$," +
        "'networkType':\"LINE\"," +
        "'queryOption':\"ATTRIBUTEANDGEOMETRY\"," +
        "'queryParams':[$params$" +
        "]," +
        "'startRecord':0,'holdTime':10," +
        "'returnCustomResult':false}," +
        "$bounds$",
        bounds: "'bounds': {'rightTop':{'y':$rightTopY$,'x':$rightTopX$},'leftBottom':{'y':$leftBottomY$,'x':$leftBottomX$}}",
        params: "{'name':\"$name$\"," +
        "'attributeFilter':\"$where$\"," +
        "'joinItems':null," +
        "'linkItems':null," +
        "'ids':null,'orderBy':null," +
        "'groupBy':null,'fields':null},"
    },

    initialize: function (options) {
        L.setOptions(this, options);
        return this;
    },
    //坐标转换
    _transform: {
        //西长安街定制需求，优化代码从配置中获取
        param: {
            "A" : 4.506454,
            "B" : 4.45686,
            "C" : 3607607,
            "D" : 2.009036,
            "E" : 2.060451,
            "F" : 387757.6
        },
        //x 为lng ,y 为lat
        point2To25: function (param, x, y) {
            var p = {};
            var xx = param.A * x + param.B * y - param.C;
            var yy = param.E * y - param.D * x + param.F;
            p.x = xx;
            p.y = yy;
            return p;
        },
        point25To2: function (param, x, y) {
            var p = {};
            var xx = (param.E * x - param.B * y + param.F * param.B + param.E * param.C) / (param.A * param.E + param.B * param.D);
            var yy = (0 - param.D * x - param.A * y + param.A * param.F - param.C * param.D) / (0 - param.B * param.D - param.A * param.E);
            p.x = xx;
            p.y = yy;
            return p;
        }
    },
    //处理返回时的面对象
    _fixPolygon: function (parts, points, result, attrs) {
        var innerPoints = [];
        var start = 0;
        var end = parts[0];
        for(var partIndex in parts){
            var tempPoints = [];
            var arrayPoints = [];
            for(i = start; i < end; i++){
                if (this.options.isInnerTransform) {
                    var transPoint = L.Util.transform.point25To2(points[i].x, points[i].y)
                    arrayPoints.push([transPoint.y, transPoint.x]);
                }else if (this.options.isSuperTransform && this.options.currentBaseLayerConf == "defaultLayer"){
                    var transPoint = this._transform.point2To25(this._transform.param, points[i].x, points[i].y);
                    transPoint = L.Projection.Mercator.unproject(transPoint);
                    arrayPoints.push([transPoint.lat, transPoint.lng]);
                }else {
                    arrayPoints.push(L.Projection.Mercator.unproject(new L.point(points[i].x, points[i].y)));
                }
            }
            if(partIndex + 1 < points.length){
                start = end;
                end = end + parts[partIndex + 1];
            }
            tempPoints.push(arrayPoints);
            innerPoints.push(tempPoints);
        }

        var polygon = new L.Polygon(innerPoints, {
            attrs: attrs
        });
        var prooerties = {};
        for (var i in attrs.fieldNames) {
            prooerties[attrs.fieldNames[i].toUpperCase()] = attrs.fieldValues[i];
        }

        polygon.feature = polygon.toGeoJSON();
        polygon.feature.properties = prooerties;
        polygon.feature.id = "smid"+prooerties.SMID
        polygon.addTo(result, prooerties.SMID);
    },
    //处理返回时的点对象
    _fixPoint: function (points, result, attrs) {
        for (var index in points) {
            var marker;
            if (this.options.isInnerTransform) {
                var transPoint = L.Util.transform.point25To2(points[index].x, points[index].y)
                marker = L.marker([transPoint.y, transPoint.x], {
                    attrs: attrs
                })
            }else if (this.options.isSuperTransform && this.options.currentBaseLayerConf == "defaultLayer"){
                var transPoint = this._transform.point2To25(this._transform.param, points[index].x, points[index].y);
                transPoint = L.Projection.Mercator.unproject(transPoint);
                marker = L.marker(transPoint, {
                    attrs: attrs
                })
            }else {
                marker = L.marker(L.Projection.Mercator.unproject(new L.point(points[index].x, points[index].y)), {
                    attrs: attrs
                })
            }
            var prooerties = {};
            for (var i in attrs.fieldNames) {
                prooerties[attrs.fieldNames[i].toUpperCase()] = attrs.fieldValues[i];
            }
            marker.feature = marker.toGeoJSON();
            marker.feature.properties = prooerties;
            marker.feature.id = "smid"+prooerties.SMID;
            marker.addTo(result);
        }
    },
    _fixLine: function (points, result, attrs) {
        var innerPoints = [];
        for (var index in points) {
            if (this.options.isInnerTransform) {
                var transPoint = L.Util.transform.point25To2(points[index].x, points[index].y)
                innerPoints.push([transPoint.y, transPoint.x]);
            }
            else {
                innerPoints.push(L.Projection.Mercator.unproject(new L.point(points[index].x, points[index].y)));
            }

        }
        var polyline = new L.Polyline(innerPoints, {
            attrs: attrs
        });
        var prooerties = {};
        for (var i in attrs.fieldNames) {
            prooerties[attrs.fieldNames[i].toUpperCase()] = attrs.fieldValues[i];
        }

        polyline.feature = polyline.toGeoJSON();
        polyline.feature.properties = prooerties;
        polyline.feature.id = "smid"+prooerties.SMID;
        polyline.addTo(result);
    },
    _toQueryStr: function () {
        var timestamp = Date.parse(new Date());
        var content = this._body.content;
        var paramStr = this._body.params;
        var options = this.options;
        content = content.toString().replace("$queryMode$", options.queryMode);
        content = content.toString().replace("$expectCount$", options.expectCount);

        var temParamStr = "";
        for (var i = 0; i < options.params.length; i++) {
            var item = paramStr.toString().replace("$name$", options.params[i].tableName);
            item = item.toString().replace("$where$", options.params[i].where);
            temParamStr += item;
        }
        content = content.toString().replace("$params$", temParamStr);
        if (options.queryMode == "SpatialQuery") {
            content = content.toString().replace("$bounds$", this._geomToStr(options.bounds));
            content += ",'spatialQueryMode':\"" + options.spatialRelation + "\"}"
        }
        else if (options.queryMode == "BoundsQuery" || options.queryMode == "SqlQuery") {
            content = content.toString().replace("$bounds$", this._boundsToStr(options.bounds));
            content += "}"
        } else if (options.queryMode == "DistanceQuery") {
            content = content.toString().replace("$bounds$", this._geomToStr(options.bounds));
            content += ",'spatialQueryMode':\"" + options.spatialRelation + "\"}"
            content += ",'distance':\"" + options.distance + "\"}"
        }


        var contentCount = Math.ceil(content.getLength() / 1000);
        var bodys = [];

        for (var index = 0; index < contentCount; index++) {
            var temContext = content.substring(index * 1000, (index * 1000) + 1000);

            bodys[index] = {
                returnContent: true,
                _method: 'POST',
                sectionCount: contentCount == 1 ? 1 : contentCount + 1,
                sectionIndex: index,
                requestEntity: temContext,
                jsonpUserID: timestamp
            };
        }
        if (contentCount > 1) {
            bodys.push({
                returnContent: true,
                _method: 'POST',
                sectionCount: contentCount + 1,
                sectionIndex: contentCount,
                jsonpUserID: timestamp
            });
        }
        return bodys;
    },
    _boundsToStr: function (bounds) {
        var boundsStr = this._body.bounds;
        if (bounds) {
            var northEast = bounds._northEast
            var southWest = bounds._southWest
            if (this.options.outProj == "m") {
                northEast = L.Projection.Mercator.project(northEast);
                southWest = L.Projection.Mercator.project(southWest);

            }
            boundsStr = boundsStr.toString().replace("$rightTopY$", northEast.y);
            boundsStr = boundsStr.toString().replace("$rightTopX$", northEast.x);
            boundsStr = boundsStr.toString().replace("$leftBottomY$", southWest.y);
            boundsStr = boundsStr.toString().replace("$leftBottomX$", southWest.x);
            return boundsStr;
        }
        else {
            return "";
        }
    },
    _geomToStr: function (feature) {
        var geoType = feature.toGeoJSON().geometry.type;
        switch (geoType.toString()) {
            case "Polygon":
                geoType = "REGION";
                break;
            case "Polyline":
                geoType = "LINE";
                break;
            case "Point":
                geoType = "POINT";
                break;
        }
        var featureJson = "'geometry':{'id':" + Date.parse(new Date()) + ",'style':null,'type':\"" + geoType + "\",'prjCoordSys':{'epsgCode':null},'parts':[";
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
            for (var i in feature._latlngs[0]) {
                var temPoint = feature._latlngs[0][i];
                if (this.options.outProj == "m") {
                    temPoint = L.Projection.Mercator.project(temPoint);
                }
                featureJson += "{'id':\"0\",'x':" + temPoint.x + ",'y':" + temPoint.y + ",'tag':null,'bounds':null,'SRID':null},"
            }
        }
        featureJson += "]}";
        return featureJson;
    },
    get: function (url, callback, context) {
        var queryTask = this._toQueryStr();
        for (var times = 0; times < queryTask.length - 1; times++) {
            this.noReturnJP(url, queryTask[times])
        }
        var _queryparam = {};
        if(context.formerid){
            _queryparam.formerid = context.formerid;
            _queryparam.center = context.center;
            _queryparam.halfheight = context.halfheight;
            _queryparam.halfwidth = context.halfwidth;
        }
        this.JSONP(url, queryTask[queryTask.length - 1], function (a, b, p) {
            var result = new L.featureGroup();
            for (var recordIndex = 0; recordIndex < b.recordsets.length; recordIndex++) {
                for (var i = 0; i < b.recordsets[recordIndex].features.length; i++) {
                    var attrs = {
                        fieldNames: b.recordsets[recordIndex].features[i].fieldNames,
                        fieldValues: b.recordsets[recordIndex].features[i].fieldValues
                    }
                    var points = b.recordsets[recordIndex].features[i].geometry.points;
                    var parts = b.recordsets[recordIndex].features[i].geometry.parts;
                    switch (b.recordsets[recordIndex].features[i].geometry.type) {
                        case "REGION":
                            this._fixPolygon(parts, points, result, attrs);
                            break;
                        case "POINT":
                            this._fixPoint(points, result, attrs);
                            break;
                        case "LINE":
                            this._fixLine(points, result, attrs);
                            break;
                    }
                }
            }
            callback.call(context, result, p);
        }, this, _queryparam);
    }

})


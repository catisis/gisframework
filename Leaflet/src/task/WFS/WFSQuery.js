L.WFSQuery = L.Class.extend({
    includes: [L.Mixin.Events, L.Request],
    options: {
        crs: L.CRS.EPSG3857,
        showExisting: true,
        geometryField: 'Shape',
        version: '1.1.0',
        typeNS: '',
        typeName: '',
        typeNSName: '',
        filter: {},
        isInnerTransform: false,
        fields: [],
        netSP: "http://www.baidu.com"
    },
    initialize: function (options, readFormat) {
        L.setOptions(this, options);
        this.options.typeNSName = this._namespaceName(this.options.typeName);
        this.options.srsName = this.options.crs.code;
        this.readFormat = readFormat || new L.Format.GeoJSON();

        if (!this.options.filter) {
            this.options.filter = new L.Filter();
        }
        if (this.options.isInnerTransform) {
            this.options.coordsToLatLng = function (coords) {
                var point = L.Util.transform.point25To2(coords[0], coords[1]);
                var latlng = new L.LatLng(point.y, point.x);
                return latlng;
            };
        }
        else {
            this.options.coordsToLatLng = new (function (projection) {
                var proj = projection;
                return function (coords) {
                    var point = L.point(coords[0], coords[1]);
                    return proj.unproject(point);
                }
            })(this.options.crs.projection);
        }
        return this;
    },
    get: function (url, callback, context) {
        var _queryparam = {};
        if(context.formerid){
            _queryparam.formerid = context.formerid;
            _queryparam.center = context.center;
            _queryparam.halfheight = context.halfheight;
            _queryparam.halfwidth = context.halfwidth;
            _queryparam.random = context.random;
        }
        this.post(url, L.XmlUtil.createXmlDocumentString(this._getFeature(this.options.filter)),
            function (a, data, _queryparam) {
                var layers = this.readFormat.responseToLayers({
                    rawData: data,
                    coordsToLatLng: this.options.coordsToLatLng,
                    options: this.options
                });
                callback.call(context, layers, _queryparam);
            }, this, undefined, _queryparam)
    },
    _namespaceName: function (name) {
        return this.options.typeNS + ':' + name;
    },
    _getFeature: function (filter) {
        var request = L.XmlUtil.createElementNS('wfs:GetFeature',
            {
                service: 'WFS',
                version: this.options.version,
                outputFormat: this.readFormat.outputFormat
            });

        var query = request.appendChild(L.XmlUtil.createElementNS('wfs:Query',
            {
                typeName: this.options.typeNSName,
                srsName: this.options.srsName
            }));

        for (var i in this.options.fields) {

            var field = L.XmlUtil.createElementNS('wfs:PropertyName');
            field.textContent = this.options.fields[i];
            query.appendChild(field);
        }


        if (filter && filter.toGml) {
            query.appendChild(filter.toGml());
        }

        return request;
    }

})


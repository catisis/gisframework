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
L.EsriQuery = EsriLeaflet.Tasks.Task.extend({
    includes: [L.Mixin.Events],

    options: {
        // url:"http://192.168.0.191:8091/iserver/services/map-DY/rest/maps/DY25/queryResults.jsonp",
    },

    setters: {
        'offset': 'offset',
        'limit': 'limit',
        'fields': 'outFields',
        'precision': 'geometryPrecision',
        'featureIds': 'objectIds',
        'returnGeometry': 'returnGeometry',
        'token': 'token'
    },

    path: 'query',

    params: {
        returnGeometry: true,
        where: '1=1',
        outSr: 4326,
        outFields: '*'
    },
    //条件参数
    within: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelContains'; // will make code read layer within geometry, to the api this will reads geometry contains layer
        return this;
    },

    intersects: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelIntersects';
        return this;
    },

    contains: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelWithin'; // will make code read layer contains geometry, to the api this will reads geometry within layer
        return this;
    },
    _cleanParams: function () {
        delete this.params.returnIdsOnly;
        delete this.params.returnExtentOnly;
        delete this.params.returnCountOnly;
    },

    // crosses: function(geometry){
    //   this._setGeometry(geometry);
    //   this.params.spatialRel = 'esriSpatialRelCrosses';
    //   return this;
    // },

    // touches: function(geometry){
    //   this._setGeometry(geometry);
    //   this.params.spatialRel = 'esriSpatialRelTouches';
    //   return this;
    // },

    overlaps: function (geometry) {
        this._setGeometry(geometry);
        this.params.spatialRel = 'esriSpatialRelOverlaps';
        return this;
    },

    // only valid for Feature Services running on ArcGIS Server 10.3 or ArcGIS Online
    nearby: function (latlng, radius) {
        latlng = L.latLng(latlng);
        this.params.geometry = [latlng.lng, latlng.lat];
        this.params.geometryType = 'esriGeometryPoint';
        this.params.spatialRel = 'esriSpatialRelIntersects';
        this.params.units = 'esriSRUnit_Meter';
        this.params.distance = radius;
        this.params.inSr = 4326;
        return this;
    },

    where: function (string) {
        this.params.where = string.replace(/"/g, "\'"); // jshint ignore:line
        return this;
    },

    between: function (start, end) {
        this.params.time = [start.valueOf(), end.valueOf()];
        return this;
    },

    simplify: function (map, factor) {
        var mapWidth = Math.abs(map.getBounds().getWest() - map.getBounds().getEast());
        this.params.maxAllowableOffset = (mapWidth / map.getSize().y) * factor;
        return this;
    },

    orderBy: function (fieldName, order) {
        order = order || 'ASC';
        this.params.orderByFields = (this.params.orderByFields) ? this.params.orderByFields + ',' : '';
        this.params.orderByFields += ([fieldName, order]).join(' ');
        return this;
    },

    _setGeometry: function (geometry) {
        this.params.inSr = 4326;

        // convert bounds to extent and finish
        if (geometry instanceof L.LatLngBounds) {
            // set geometry + geometryType
            this.params.geometry = EsriLeaflet.Util.boundsToExtent(geometry);
            this.params.geometryType = 'esriGeometryEnvelope';
            return;
        }

        // convert L.Marker > L.LatLng
        if (geometry.getLatLng) {
            geometry = geometry.getLatLng();
        }

        // convert L.LatLng to a geojson point and continue;
        if (geometry instanceof L.LatLng) {
            geometry = {
                type: 'Point',
                coordinates: [geometry.lng, geometry.lat]
            };
        }

        // handle L.GeoJSON, pull out the first geometry
        if (geometry instanceof L.GeoJSON) {
            //reassign geometry to the GeoJSON value  (we are assuming that only one feature is present)
            geometry = geometry.getLayers()[0].feature.geometry;
            this.params.geometry = EsriLeaflet.Util.geojsonToArcGIS(geometry);
            this.params.geometryType = EsriLeaflet.Util.geojsonTypeToArcGIS(geometry.type);
        }

        // Handle L.Polyline and L.Polygon
        if (geometry.toGeoJSON) {
            geometry = geometry.toGeoJSON();
        }

        // handle GeoJSON feature by pulling out the geometry
        if (geometry.type === 'Feature') {
            // get the geometry of the geojson feature
            geometry = geometry.geometry;
        }

        // confirm that our GeoJSON is a point, line or polygon
        if (geometry.type === 'Point' || geometry.type === 'LineString' || geometry.type === 'Polygon') {
            this.params.geometry = EsriLeaflet.Util.geojsonToArcGIS(geometry);
            this.params.geometryType = EsriLeaflet.Util.geojsonTypeToArcGIS(geometry.type);
            return;
        }

        // warn the user if we havn't found a
        /* global console */
        if (console && console.warn) {
            console.warn('invalid geometry passed to spatial query. Should be an L.LatLng, L.LatLngBounds or L.Marker or a GeoJSON Point Line or Polygon object');
        }

        return;
    },


    initialize: function (options) {

        options.url = L.esri.Util.cleanUrl(options.url);
        L.setOptions(this, options);

        // clone default params into this object
        this.params = L.Util.extend({}, this.params || {});

        // generate setter methods based on the setters object implimented a child class
        if(this.setters){
            for (var setter in this.setters){
                var param = this.setters[setter];
                this[setter] = this.generateSetter(param, this);
            }
        }

        return this;
    },

    _updateLayerGeometry: function (layer, geojson) {
        // convert the geojson coordinates into a Leaflet LatLng array/nested arrays
        // pass it to setLatLngs to update layer geometries
        var latlngs = [];
        var coordsToLatLng = this.options.coordsToLatLng || L.GeoJSON.coordsToLatLng;

        switch (geojson.geometry.type) {
            case 'LineString':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 0, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
            case 'MultiLineString':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
            case 'Polygon':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 1, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
            case 'MultiPolygon':
                latlngs = L.GeoJSON.coordsToLatLngs(geojson.geometry.coordinates, 2, coordsToLatLng);
                layer.setLatLngs(latlngs);
                break;
        }
    },

    createNewLayer: function (geojson) {
        // @TODO Leaflet 0.8
        //newLayer = L.GeoJSON.geometryToLayer(geojson, this.options);
        return L.GeoJSON.geometryToLayer(geojson);
    },

    doQuery: function (callback, context) {
        this._cleanParams();

        // if the service is hosted on arcgis online request geojson directly
        if (EsriLeaflet.Util.isArcgisOnline(this.options.url)) {
            this.params.f = 'geojson';

            return this.request(function (error, response) {
                var features = response;
                featureGroup = new L.FeatureGroup();
                for (var i = 0; i < features.features.length; i++) {
                    //console.log(i);
                    //if (i == 87)
                    //    debugger;
                    if (!features.features[i].geometry)
                        continue;
                    if (features.features[i].geometry.coordinates) {
                        var geom = L.GeoJSON.geometryToLayer(features.features[i]);
                        if(!geom)
                            continue;
                        geom.feature.id = (geom.feature.properties.OBJECTID || geom.feature.properties.FID);
                        geom.addTo(featureGroup, "OBJECTID_" + (geom.feature.properties.OBJECTID || geom.feature.properties.FID));
                    }
                }
                callback.call(context, error, featureGroup, response);
            }, context);

            // otherwise convert it in the callback then pass it on
        } else {
            return this.request(function (error, response) {
                var features = EsriLeaflet.Util.responseToFeatureCollection(response),
                    featureGroup = new L.FeatureGroup();
                for (var i = 0; i < features.features.length; i++) {
                    var geom = L.GeoJSON.geometryToLayer(features.features[i]);
                    geom.feature.id = (geom.feature.properties.OBJECTID || geom.feature.properties.FID);
                    geom.addTo(featureGroup, "OBJECTID_" + (geom.feature.properties.OBJECTID || geom.feature.properties.FID));
                }
                callback.call(context, error, featureGroup, response);
            }, context);
        }
    }

})


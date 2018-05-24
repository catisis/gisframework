/**
 * Created by PRadostev on 30.01.2015.
 * Translate GeoJSON to leaflet structures
 */

L.Format.GeoJSON = L.Format.extend({

    initialize: function (options) {
        L.Format.prototype.initialize.call(this, options);
        this.outputFormat = 'application/json';
    },

    responseToLayers: function (options) {
        options = options || {};
        var layers = {};
        var geoJson = options.rawData;

        for (var i = 0; i < geoJson.features.length; i++) {
            var layer = L.GeoJSON.geometryToLayer(geoJson.features[i], options);
            if (layer == null) {
                continue;
            }
            layer.feature = geoJson.features[i];
            layers[layer.feature.id] = layer;
        }

        return layers;
    }
});

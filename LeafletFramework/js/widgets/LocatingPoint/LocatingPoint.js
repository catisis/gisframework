/**
 * Created by bk on 2016/12/1.
 */
VitoGIS.LocatingPoint = function (_this) {
    this.method = _this;
};

VitoGIS.LocatingPoint.prototype = {
    locate: function (points, lables, content, markOptions,layer, flag, polygons) {
        var that = this.method;
        var resultLayer = layer || this.method.layerManager.resultLayer;
        var options = {};
        if (markOptions) {
            options = markOptions;
        }
        for (var index in points) {
            var mark = new L.Marker(points[index], options);
            if (content)
                mark.bindPopup(content, {maxWidth: 500, maxHeight: 500, className: "info"});
            if (lables)
                mark.bindLabel(lables[index], {offset: [12, -15], noHide: true});

            mark.addTo(resultLayer);

            (function(i) {
                mark.on("mouseover", function (e) {
                    var style = {
                        "fillOpacity": 0.5,
                        "opacity": 0.1,
                        "fillColor": "#CD4F39"
                    };
                    var wkt = new Wkt.Wkt();
                    wkt.read(polygons[i].wkt);
                    var feature = wkt.toObject();
                    //feature.bindLabel(polygons[i].attr.title || "", {
                    //    offset: [0,0],
                    //    direction: "auto",
                    //    noHide: polygons[i].attr.hide || false
                    //});
                    feature["setStyle"](style);
                    that.pLayer = new L.featureGroup();
                    that.pLayer.addTo(that.layerManager.map);
                    feature.addTo(that.pLayer);
                });
            })(index);

            mark.on("mouseout", function (e) {
                that.pLayer.clearLayers();
            });
        }
        if(flag) {
            this.method.layerManager.map.fitBounds(resultLayer.getBounds());
        }

    }
};
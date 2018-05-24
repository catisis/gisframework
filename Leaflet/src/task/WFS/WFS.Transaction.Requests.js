/**
 * Created by PRadostev on 20.02.2015.
 */

L.WFSTransaction.include({

    insert: function (layer) {
        var node = L.XmlUtil.createElementNS('wfs:Insert');
        node.appendChild(this.gmlFeature(layer));
        return node;
    },

    update: function (layer) {
        var node = L.XmlUtil.createElementNS('wfs:Update', {typeName: this.options.typeNSName});
        //判断传入的是属性还是layer
        var feature = {}, isFeature = true, filter;
        if (layer.isfilter) {
            isFeature = false;
        } else {
            feature.properties = layer.properties;
            isFeature = true;
        }

        for (var propertyName in layer.feature.properties) {
            node.appendChild(this.wfsProperty(propertyName, layer.feature.properties[propertyName]));
        }
        if (layer.toGml) {
            node.appendChild(this.wfsProperty(this._namespaceName(this.options.geometryField),
                layer.toGml(this.options.crs)));
        }
        if (isFeature) {
            filter = new L.Filter.GmlObjectID().append(layer.feature.id);
        }
        else {
            filter = new L.Where({where: layer.where || null});
        }
        node.appendChild(filter.toGml());
        return node;
    },

    remove: function (filter) {
        var node = L.XmlUtil.createElementNS('wfs:Delete', {typeName: this.options.typeNSName});
        //   var filter = new L.Filter.GmlObjectID().append(layer.feature.id);
        node.appendChild(filter.toGml());
        return node;
    }
});
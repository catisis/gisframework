/**
 * Created by PRadostev on 06.02.2015.
 */

L.WFSTransaction = L.WFSQuery.extend({
    initialize: function (options, readFormat) {
        L.WFSQuery.prototype.initialize.call(this, options, readFormat);
        this.changes = {};
        var that = this;
        this.on('save:success', function () {
            that.changes = {};
        });
    },


    save: function (url, layer, action, callback, context) {
        var obj =  {
            service: 'WFS',
            version: this.options.version
        }
        obj["xmlns:" + this.options.typeNS] = this.options.netSP;
        var transaction = L.XmlUtil.createElementNS('wfs:Transaction', obj);

        var inserted = [];

        var taskStr = this[action](layer);
        transaction.appendChild(taskStr);

        var that = this;

        this.post(url, L.XmlUtil.createXmlDocumentString(transaction), function (a, data, c) {
            var insertResult = L.XmlUtil.evaluate('//wfs:InsertResults/wfs:Feature/ogc:FeatureId/@fid', data);
            var filter = new L.Filter.GmlObjectID();
            var id = insertResult.iterateNext();
            while (id) {
                filter.append(id.value);
                id = insertResult.iterateNext();
            }
            //
            inserted.forEach(function (layer) {
                L.FeatureGroup.prototype.removeLayer.call(that, layer);
            });

            this.once('load', function () {
                this.fire('save:success');
            });
            if (callback) {
                callback.call(context, data);
            }

        }, this, "xml")


        return this;
    }
});
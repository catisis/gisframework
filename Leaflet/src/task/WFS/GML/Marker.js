/**
 * Created by PRadostev on 20.02.2015.
 */

L.Marker.include({
    toGml: function (crs) {
        var node = L.XmlUtil.createElementNS('gml:Point', {srsName: crs.code});
        node.appendChild(L.GMLUtil.posNode(crs.projection.project(this.getLatLng())));
        return node;
    }
});
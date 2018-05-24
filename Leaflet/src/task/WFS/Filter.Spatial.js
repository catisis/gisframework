L.Filter.Spatial = L.Filter.extend({
    //Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
    append: function (relation,geom,crs,geom_field) {
        var node =  L.XmlUtil.createElementNS(relation);
        var propertyName = L.XmlUtil.createElementNS("ogc:PropertyName");
            propertyName.appendChild(L.XmlUtil.createTextNode(geom_field || "the_geom"));
            node.appendChild(propertyName);
        var propertyValue = geom.toGml(crs);
            node.appendChild(propertyValue);
        this.filter.appendChild(node);
        return node;
    }
});
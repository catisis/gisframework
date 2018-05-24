L.Filter.BBox = L.Filter.extend({
    //Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
    append: function (bounds,crs,geom_field) {
        var node =  L.XmlUtil.createElementNS("ogc:BBOX");
        var propertyName = L.XmlUtil.createElementNS("ogc:PropertyName");
        propertyName.appendChild(L.XmlUtil.createTextNode(geom_field||"the_geom"));
        node.appendChild(propertyName);
        //var propertyValue = geom.toGml(crs);
        //node.appendChild(propertyValue);

        var envelope = L.XmlUtil.createElementNS("gml:Envelope",{srsName:"http://www.opengis.net/gml/srs/epsg.xml#"+crs.code.substring(5)});

        var lowerCorner = L.XmlUtil.createElementNS("gml:lowerCorner");
        var lowerCornerPoint = crs.project(bounds._southWest);
        lowerCorner.appendChild(L.XmlUtil.createTextNode(lowerCornerPoint.x + " " + lowerCornerPoint.y));
        envelope.appendChild(lowerCorner);
        var upperCorner = L.XmlUtil.createElementNS("gml:upperCorner");
        var upperCornerPoint = crs.project(bounds._northEast);
        upperCorner.appendChild(L.XmlUtil.createTextNode(upperCornerPoint.x + " " + upperCornerPoint.y));
        envelope.appendChild(upperCorner);

        node.appendChild(envelope)

        this.filter.appendChild(node);
        return node;
    }
});
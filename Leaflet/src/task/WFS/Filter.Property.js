/**
 * Created by bk on 2015/6/5.
 *
 * TYPE : PropertyIsEqualTo,PropertyIsNotEqualTo,PropertyIsLessThan,PropertyIsGreaterThan,
 *        PropertyIsLessThanOrEq,PropertyIsGreaterThanO,PropertyIsLik,PropertyIsNull,
 *        PropertyIsBetween
 */


L.Filter.Property = L.Filter.extend({
    append: function (params) {
        var innerRelation = L.XmlUtil.createElementNS("ogc:Or");
        for (var i in params) {
            var node = L.XmlUtil.createElementNS("ogc:" + params[i].relation, {wildCard: "*", singleChar: "?", escapeChar: "\\"});

            var propertyName = L.XmlUtil.createElementNS("ogc:PropertyName");
            propertyName.appendChild(L.XmlUtil.createTextNode(params[i].propertyName));
            node.appendChild(propertyName);

            var propertyValue = L.XmlUtil.createElementNS("ogc:Literal");
            propertyValue.appendChild(L.XmlUtil.createTextNode(params[i].propertyValue));
            node.appendChild(propertyValue);

            innerRelation.appendChild(node)

        }
        this.filter.appendChild(innerRelation);
        return innerRelation;
    }
});
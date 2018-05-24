/**
 * Where语句
 * @class L.Where
 * @param {[Object]} Options 初始化参数
 *
 * geometry
 *
 * where
 *
 * spatialRelation  类型为：Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
 *
 * crs
 */
//Equals，Disjoint，Touches，Within，Overlaps，Crosses，Intersects，Contains，DWithin，Beyond
L.Where = L.Class.extend({
    options: {
        geometry: null,
        where: "",
        bounds: null,
        spatialRelation: "Intersects",
        crs: {}
    },
    initialize: function (options) {
        this.filter = L.XmlUtil.createElementNS('ogc:Filter');
        this.geometry = options.geometry
        this.bounds = options.bounds
        this.spatialRelation = options.spatialRelation || "Intersects";
        this.whereStr = options.where || "";
        this.crs = options.crs;
        this.geom_field = options.geom_field || null;
        this.filters = [];
        var innerRelation = L.XmlUtil.createElementNS("ogc:And");


        var part = this._differentiateAnd(this.whereStr);
        for (var i in part) {
            this._setInFilters(this.filters, part[i]);
        }

        if (this.geometry) {
            var filter = new L.Filter.Spatial();
            this.filters.push(filter.append(this.spatialRelation, this.geometry, this.crs, this.geom_field));
        }

        if (this.bounds) {
            var filter = new L.Filter.BBox();
            this.filters.push(filter.append(this.bounds, this.crs, this.geom_field));
        }

        for (var j in this.filters) {
            innerRelation.appendChild(this.filters[j])
            this.filter.appendChild(innerRelation);
        }
    },
    _setInFilters: function (filters, str) {
        if (str.indexOf(" in ") > 0) {
            var value, valueArr, colum, params = [], filter = new L.Filter.Property(),
                startIndex = str.indexOf("("),
                endIndex = str.indexOf(")"),
                keyWordIndex = str.indexOf(" in ")
            value = str.substring(startIndex + 1, endIndex);
            colum = str.substring(0, keyWordIndex);
            valueArr = value.split(",");
            for (var i in valueArr) {
                params.push({
                    relation: "PropertyIsLike",
                    propertyName: colum,
                    propertyValue: valueArr[i]
                })
            }
            filters.push(filter.append(params));
        }
        else if (str.indexOf(" = ") > 0) {
            var value, valueArr, colum, params = [], filter = new L.Filter.Property(),
                startIndex = str.indexOf("("),
                endIndex = str.indexOf(")"),
                keyWordIndex = str.indexOf(" = ")
            value = str.substring(startIndex + 1, endIndex);
            colum = str.substring(0, keyWordIndex);
            valueArr = value.split(",");
            for (var i in valueArr) {
                params.push({
                    relation: "PropertyIsEqualTo",
                    propertyName: colum,
                    propertyValue: valueArr[i]
                })
            }
            filters.push(filter.append(params));
        }
    },
    _differentiateAnd: function (str, arr) {
        if (!arr)
            arr = [];
        var currentStr;
        if (str.indexOf(" and ") > 0) {
            var startIndex = 0,
                endIndex = str.indexOf(" and ");
            currentStr = str.substring(endIndex + 5);
            arr.push(str.substring(startIndex, endIndex));
            return this._differentiateAnd(currentStr, arr);
        } else {
            arr.push(str);
            return arr;
        }
    },
    /**
     * Represents this filter as GML node
     *
     * Returns:
     * {XmlElement} Gml representation of this filter
     */
    toGml: function () {
        return this.filter;
    },

    append: function () {
        return this;
    }
});
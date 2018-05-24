/**
 * L.Control.GeoSearch - search for an address and zoom to it's location
 * L.GeoSearch.Provider.Bing uses bing geocoding service
 * https://github.com/smeijer/L.GeoSearch
 */

L.GeoSearch.Provider.Bing = L.Class.extend({
    options: {
        proxy: "",
        key: "",
        region: ""
    },

    initialize: function (options) {
        options = L.Util.setOptions(this, options);
    },

    GetServiceUrl: function (qry) {
        var parameters = {
            query: qry,
            region: this.options.region || 131,
            output: 'json',
            ak: this.options.key || 'F429b1f174179ddf0a092d6843984d79'
        };
        return this.options.proxy + 'http://api.map.baidu.com/place/v2/suggestion'
            + L.Util.getParamString(parameters);
    },

    ParseJSON: function (fault, data) {
        /*  var results = [];
         for (var i in data.result) {
         results.push(data.result[i]);
         }*/
        this._printList(data.result);
        //  return results;
    }
});

/*
 * L.Control.GeoSearch - search for an address and zoom to its location
 * https://github.com/smeijer/L.GeoSearch
 */

L.GeoSearch = {};
L.GeoSearch.Provider = {};

L.GeoSearch.Result = function (x, y, label, bounds, details) {
    this.X = x;
    this.Y = y;
    this.Label = label;
    this.bounds = bounds;

    if (details)
        this.details = details;
};

L.Control.GeoSearch = L.Control.extend({
    options: {
        position: 'topcenter',
        showMarker: true,
        retainZoomLevel: false,
        draggable: false,
        isProjInMap: false,
        proj: null
    },

    _config: {
        country: '',
        searchLabel: '输入查询地址 ...',
        notFoundMessage: '对不起没有找到相关信息。',
        messageHideDelay: 3000,
        zoomLevel: 18
    },

    initialize: function (options) {
        L.Util.extend(this.options, options);
        L.Util.extend(this._config, options);
    },

    onAdd: function (map) {
        var $controlContainer = map._controlContainer,
            nodes = $controlContainer.childNodes,
            topCenter = false;

        for (var i = 0, len = nodes.length; i < len; i++) {
            var klass = nodes[i].className;
            if (/leaflet-top/.test(klass) && /leaflet-center/.test(klass)) {
                topCenter = true;
                break;
            }
        }

        if (!topCenter) {
            var tc = document.createElement('div');
            tc.className += 'leaflet-top leaflet-center';
            $controlContainer.appendChild(tc);
            map._controlCorners.topcenter = tc;
        }

        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-control-geosearch');

        var searchbox = document.createElement('input');
        searchbox.id = 'leaflet-control-geosearch-qry';
        searchbox.type = 'text';
        searchbox.placeholder = this._config.searchLabel;
        this._searchbox = searchbox;

        var msgbox = document.createElement('div');
        msgbox.id = 'leaflet-control-geosearch-msg';
        msgbox.className = 'leaflet-control-geosearch-msg';
        this._msgbox = msgbox;

        var resultslist = document.createElement('ul');
        resultslist.id = 'leaflet-control-geosearch-results';
        this._resultslist = resultslist;

        this._msgbox.appendChild(this._resultslist);
        this._container.appendChild(this._searchbox);
        this._container.appendChild(this._msgbox);

        L.DomEvent
            .addListener(this._container, 'click', L.DomEvent.stop)
            .addListener(this._searchbox, 'keypress', this._onKeyUp, this)
            .addListener(this._searchbox, 'keyup', this._onKeyUp_, this);


        L.DomEvent.disableClickPropagation(this._container);

        return this._container;
    },

    geosearch: function (qry) {
        var that = this;
        try {
            var provider = this._config.provider;

            if (typeof provider.GetLocations == 'function') {
                var results = provider.GetLocations(qry, function (results) {
                    that._processResults(results);
                });
            }
            else {
                var url = provider.GetServiceUrl(qry);
                L.Request.get(url, "", provider.ParseJSON, this);
                // this.sendRequest(provider, url);
            }
        }
        catch (error) {
            this._printError(error);
        }
    },


    _processResults: function (results) {
        if (results.length > 0) {
            this._map.fireEvent('geosearch_foundlocations', {Locations: results});
            this._showLocation(results[0]);
        } else {
            this._printError(this._config.notFoundMessage);
        }
    },

    _showLocation: function (location) {
        if (this.options.showMarker == true) {
            var latlng;
            if (this.options.proj) {
                latlng = this.options.proj.project({lat: location.Y, lng: location.X});
                location.Y = latlng.y;
                location.X = latlng.x;
            }
            if (this.options.isProjInMap) {
                latlng = this._map.options.crs.projection.unproject({x: location.Y, y: location.X});
                location.X = latlng.lat;
                location.Y = latlng.lng
            }
            if (typeof this._positionMarker === 'undefined') {
                this._positionMarker = L.marker(
                    [location.Y, location.X],
                    {draggable: this.options.draggable}
                ).addTo(this._map._layers.drawLayer);
            }
            else {
                this._positionMarker.setLatLng([location.Y, location.X]);
            }
        }
        if (!this.options.retainZoomLevel && location.bounds && location.bounds.isValid()) {
            this._map.fitBounds(location.bounds);
        }
        else {
            this._map.setView([location.Y, location.X], this._getZoomLevel(), false);
        }

        this._map.fireEvent('geosearch_showlocation', {
            Location: location,
            Marker: this._positionMarker
        });
    },

    _printError: function (message) {
        var elem = this._resultslist;
        elem.innerHTML = '<li>' + message + '</li>';
        elem.style.display = 'block';

        this._map.fireEvent('geosearch_error', {message: message});

        setTimeout(function () {
            elem.style.display = 'none';
        }, 3000);
    },

    _printList: function (list) {
        var elem = this._resultslist;
        elem.innerHTML = "";
        for (var i in list) {
            var item = L.DomUtil.create("li", "list-item");
            item.innerText = list[i].name;
            item.data = list[i];
            elem.appendChild(item);
            L.DomEvent
                .addListener(item, 'click', this._selectComplete, this)
        }
        elem.style.display = 'block';
    },
    _selectComplete: function (e) {
        this._searchbox.value = e.currentTarget.innerText;
        this._resultslist.style.display = 'none';
        var locate = {Y: e.currentTarget.data.location.lat, X: e.currentTarget.data.location.lng};
        this._showLocation(locate);
    },
    _onKeyUp: function (e) {
        var esc = 27,
            enter = 13;

        if (e.keyCode === esc) { // escape key detection is unreliable
            this._searchbox.value = '';
            this._map._container.focus();
        } else if (e.keyCode === enter) {

        }
        //  e.preventDefault();

    },
    _onKeyUp_: function (e) {
        e.stopPropagation();
        if (this._searchbox.value)
            this.geosearch(this._searchbox.value);
        else {
            this._resultslist.style.display = 'none';
        }
    },

    _getZoomLevel: function () {
        if (!this.options.retainZoomLevel) {
            return this._config.zoomLevel;
        }
        return this._map.zoom;
    }

});

L.Path.include({
    bindLabel: function (content, options) {
        if (!this.label || this.label.options !== options) {
            this.label = new L.Label(options, this);
        }

        this.label.setContent(content);

        if (!this._showLabelAdded) {
            this
                .on('remove', this._hideLabel, this)
                .on('add', this._onMarkerAdd, this);
            if (!this.label.options.noHide) {
                this
                    .on('mouseout', this._hideLabel, this)
                    .on('mouseover', this._showLabel, this)
                    .on('mousemove', this._moveLabel, this);
            }
            if (L.Browser.touch) {
                this.on('click', this._showLabel, this);
            }
            this._showLabelAdded = true;
        }

        return this;
    },

    unbindLabel: function () {
        if (this.label) {
            this._hideLabel();
            this.label = null;
            this._showLabelAdded = false;
            this
                .off('mouseover', this._showLabel, this)
                .off('mousemove', this._moveLabel, this)
                .off('mouseout remove', this._hideLabel, this);
        }
        return this;
    },

    updateLabelContent: function (content) {
        if (this.label) {
            this.label.setContent(content);
        }
    },
    _onMarkerAdd: function (e) {
        if (this.label.options.noHide) {
            var latlng = L.Util.isArray(this.getLatLngs()[this.getLatLngs().length - 1]) ? this.getCenter() : this.getLatLngs()[this.getLatLngs().length - 1]
            this._showLabel({latlng: latlng});
        }
    },
    _showLabel: function (e) {
        this.label.setLatLng(e.latlng);
        this._map.showLabel(this.label);
    },

    _moveLabel: function (e) {
        this.label.setLatLng(e.latlng);
    },

    _hideLabel: function (e) {
        this.label.close();
    }
});
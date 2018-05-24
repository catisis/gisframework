L.AnimatedMarker = L.Marker.extend({
    options: {
        // meters
        distance: 200,
        // ms
        interval: 1000,
        // animate on add?
        autoStart: true,
        // callback onend
        onEnd: function () {
        },
        clickable: false,
        //���·���������Ҫ����·��
        routeFeature: null
    },

    initialize: function (latlngs, options) {
        this.setLine(latlngs);
        L.Marker.prototype.initialize.call(this, latlngs[0], options);
    },

    // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
    // are not supported.
    _chunk: function (latlngs) {
        var i,
            len = latlngs.length,
            chunkedLatLngs = [];

        for (i = 1; i < len; i++) {
            var cur = latlngs[i - 1],
                next = latlngs[i],
                dist = cur.distanceTo(next),
                factor = this.options.distance / dist,
                dLat = factor * (next.lat - cur.lat),
                dLng = factor * (next.lng - cur.lng);

            if (dist > this.options.distance) {
                while (dist > this.options.distance) {
                    cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
                    dist = cur.distanceTo(next);
                    chunkedLatLngs.push(cur);
                }
            } else {
                chunkedLatLngs.push(cur);
            }
        }
        chunkedLatLngs.push(latlngs[len - 1]);

        return chunkedLatLngs;
    },

    onAdd: function (map) {
        L.Marker.prototype.onAdd.call(this, map);

        // Start animating when added to the map
        if (this.options.autoStart) {
            this.start();
        }
    },

    animate: function (direction) {
        var self = this,
            len = this._latlngs.length,
            lastSpeed = this.options.interval,
            speed,
            points = [],
        //间隔个数
            intervalCount,
            direction = direction || "forward";

        // Normalize the transition speed from vertex to vertex
        if (direction == "back") {
            if (this._i >= 2) {
                var count = this._latlngs[this._i - 2].distanceTo(this._latlngs[this._i - 1]) / this.options.distance;
                intervalCount = Math.floor(count)
                var lastInterValPersent = count - intervalCount;
                speed = count * this.options.interval;

                var detaLng = (this._latlngs[this._i - 1].lng - this._latlngs[this._i - 2].lng) / intervalCount,
                    detaLat = (this._latlngs[this._i - 1].lat - this._latlngs[this._i - 2].lat) / intervalCount;
                for (var i = 0; i < intervalCount; i++) {
                    //这块没有写好大概已经完成######
                    var latlng = new L.latLng(this._latlngs[this._i - 1].lat - (i + 2) * detaLat, this._latlngs[this._i - 1].lng - (i + 2) * detaLng);
                    latlng.speed = this.options.interval * i;

                    points.push(latlng);
                    if (latlng)
                        new delegateBack(latlng);
                }

            }
        } else {
            if (this._i < len) {
                var count = this._latlngs[this._i - 1].distanceTo(this._latlngs[this._i]) / this.options.distance;
                intervalCount = Math.floor(count)
                var lastInterValPersent = count - intervalCount;
                speed = count * this.options.interval;

                lastSpeed = lastInterValPersent * this.options.interval;

                var detaLng = (this._latlngs[this._i].lng - this._latlngs[this._i - 1].lng) / intervalCount,
                    detaLat = (this._latlngs[this._i].lat - this._latlngs[this._i - 1].lat) / intervalCount;
                for (var i = 0; i < intervalCount; i++) {
                    //这块没有写好大概已经完成######
                    var latlng = new L.latLng(this._latlngs[this._i - 1].lat + i * detaLat, this._latlngs[this._i - 1].lng + i * detaLng);
                    latlng.speed = this.options.interval * i

                    points.push(latlng);
                    if (latlng)
                        new delegate(latlng);
                }
                var lastLatlng = new L.latLng(this._latlngs[this._i].lat, this._latlngs[this._i].lng);
                lastLatlng.speed = lastSpeed;
            }
        }


        function delegate(point) {
            setTimeout(function () {
                self.setLatLng(point);
                if (self.options.routeFeature)
                    self.options.routeFeature.addLatLng(point);
            }, point.speed)
        }

        function delegateBack(point) {
            setTimeout(function () {
                self.setLatLng(point);
                if (self.options.routeFeature)
                    self.options.routeFeature._spliceLatLngs((self.options.routeFeature.getLatLngs().length - 1), 1);
            }, point.speed)
        }

        if (direction == "back") {
            this._i--;
        } else {
            this._i++;
        }


        // Queue up the animation to the next next vertex
        this._tid = setTimeout(function () {
            if (self._i === len) {
                self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
            } else {
                self.animate(direction);
            }
        }, speed);
    },

    // Start the animation
    start: function (direction) {
        if (this.state && this.state == "start")
            return;
        this.state = "start";
        this.animate(direction);
    },

    // Stop the animation in place
    stop: function () {
        this.state = "stop";
        if (this._tid) {
            clearTimeout(this._tid);
        }
    },

    setLine: function (latlngs) {
        if (L.DomUtil.TRANSITION) {
            // No need to to check up the line if we can animate using CSS3
            this._latlngs = latlngs;
        } else {
            // Chunk up the lines into options.distance bits
            this._latlngs = this._chunk(latlngs);
            this.options.distance = 10;
            this.options.interval = 30;
        }
        this._i = 1;
    }

});

L.animatedMarker = function (latlngs, options) {
    return new L.AnimatedMarker(latlngs, options);
};

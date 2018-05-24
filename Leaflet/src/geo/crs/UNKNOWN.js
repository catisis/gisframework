L.CRS.UNKNOWN = new L.Proj.CRS('EPSG:900913',
    '+title=Google Mercator EPSG:900913 +proj=merc +ellps=WGS84 +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    {
        resolutions: function () {
            level = 19
            var res = [];
            res[0] = 156543.033928;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        }(),
        origin: [-293909.5, 205382.0]
    })

L.CRS.BAIDU = new L.Proj.CRS('EPSG:3395',
    '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    {
        resolutions: function () {
            level = 19
            var res = [];
            res[0] = Math.pow(2, 18);
            for (var i = 1; i < level; i++) {
                res[i] = Math.pow(2, (18 - i))
            }
            return res;
        }(),
        origin: [0, 0],
        bounds: L.bounds([20037508.342789244, 0], [0, 20037508.342789244])
    })

L.CRS.YUNNAN = new L.Proj.CRS('EPSG:4326',
    '+proj=longlat +datum=WGS84 +no_defs ',
    {
        resolutions: function () {
            level = 19
            var res = [];
            res[0] = 156543.033928;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        }(),
        origin: [-293909.5, 205382.0]
    })
L.CRS.UNKNOWN.innerTransform = {
    A :629486.1,
    B :850786,
    C :106392700,
    D :321586.1,
    E :380061.7,
    F :23949170,
    project: function (lat, lng) {
        var p = {};
        var xx = this.A * lat + this.B * lng - this.C;
        var yy = this.E * lng - this.D * lat + this.F;
        p.x = xx;
        p.y = yy;
        return p;
    },
    unproject: function (x, y) {
        var p = {};
        var xx = (this.E * x - this.B * y + this.F * this.B + this.E * this.C) / (this.A * this.E + this.B * this.D);
        var yy = (0 - this.D * x - this.A * y + this.A * this.F - this.C * this.D) / (0 - this.B * this.D - this.A * this.E);
        p.lng = xx;
        p.lat = yy;
        return p;
    }
}

L.CRS.EPSG3857LZ = new L.Proj.CRS('EPSG:3857',
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    {
        resolutions: function () {
            level = 21
            var res = [];
            res[0] = 156543.033928;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            res[12] = 38.21851414253662;
            res[13] = 19.10925707126831;
            res[14] = 9.554628535634155;
            res[15] = 4.77731426794937;
            res[16] = 2.388657133974685;
            res[17] = 1.1943285668550503;
            res[18] = 0.5291677250021167;
            res[19] = 0.26458386250105836;
            return res;
        }(),
        origin: [-20037508.342787, 20037508.342787],
        tileSize: 128
    })


L.CRS.YN = new L.Proj.CRS('EPSG:4326',
    '+proj=longlat +datum=WGS84 +no_defs ',
    {
        resolutions: (function getRes(level) {
            var res = [];
            res[0] = 6.7336482437657602628525536448314;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        })(21),
        origin: [ 106.59, 26.71]
    })

L.CRS.XCAJ = new L.Proj.CRS('EPSG:4326',
    '+proj=longlat +datum=WGS84 +no_defs ',
    {
        resolutions: (function getRes(level) {
            var res = [];
            res[0] = 2.8109902583977338974280435264985;
            for (var i = 1; i < level; i++) {
                res[i] = res[i - 1] / 2;
            }
            return res;
        })(8),
        origin: [116.38, 39.93]
    })


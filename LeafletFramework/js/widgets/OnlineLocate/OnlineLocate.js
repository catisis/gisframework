/**
 * 工具组件 组件依赖transform组件
 *
 * @class VitoGIS.Tools
 */
VitoGIS.OnlineLocate = function (method) {
    this.handler = method;
    this._interval = 300;
    this._task = {};
    this._ws = {};

}
VitoGIS.OnlineLocate.prototype = {
    open: function (id) {
        this._line = new L.polyline([]);
        //line.feature = {properties: features[i].attrs, id: (features[i].attrs.id + "-line")};

        this._marker = new L.marker([0, 0]);
        //marker.feature = {properties: features[i].attrs, id: features[i].attrs.id}

        this._marker.addTo(this.handler.layerManager.resultLayer);
        this._line.addTo(this.handler.layerManager.resultLayer);


        if ('WebSocket' in window) {
            // Let us open a web socket
            var ws = new WebSocket('ws://192.168.0.49:8080/DDS/dispute/griderLocateEndPoint');
            this._task[id] = ws;
            this._task[id].marker = this._marker;
            this._task[id].line = this._line;
            this._ws = ws;
            this._task[id].onopen = function () {
                // Web Socket is connected, send data using send()
                var data = "{\"userid\":\"10000008120183\",\"locate\":\"\",\"name\":\"\",\"time\":\"\",\"type\":\"\"}";
                ws.send(data);
                alert('Message is sent...');
            };
            this._task[id].onmessage = this.received;
            this._task[id].onclose = function () {
                alert('Connection is closed...');
            };
        }
        else {
            // The browser doesn't support WebSocket
            alert('对不起你的浏览不支持Online服务');
        }
    },
    received: function (evt) {
        var msg = evt.data;
        var msg_json = JSON.parse(msg);
        var locate = L.chinaProj.gps84_To_Gcj02(Number(msg_json.lattitude), Number(msg_json.longitude));
        this.marker.setLatLng(locate);
        this.line.addLatLng(locate);
    },
    close: function (id) {
        this._task[id].close();
    }


}

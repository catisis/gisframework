/**
 * Created by bk on 2016/10/12.
 */

VitoGIS.BlinkPoint = function (_this) {
    this.method = _this;
    this.method.EPLayer = new L.featureGroup();
    this.method.EPLayer.addTo(this.method.mapManager.map);
};

VitoGIS.BlinkPoint.prototype = {
    addBlinkPoint: function(lat,lng,styleName) {
        var myIcon = L.divIcon({
            className:styleName,
            iconAnchor:[56,56],
            popupAnchor:[6,0],
            iconSize:[12,12]
        });
        var marker = L.marker([lat, lng],{icon:myIcon});
        marker.addTo(this.method.mapManager.map)
            //.bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();


        setTimeout(function(){
            marker.remove();
        }, 2000);
    },

    addEPPoint: function (EPInfo,flag) {
        var that = this.method;
        for(var i = 0; i < EPInfo.length; i++) {

            var myIcon = L.divIcon({
                className:"EPPoint",
                iconAnchor:[56,56],
                popupAnchor:[6,0],
                iconSize:[12,12]
            });
            var marker = L.marker([EPInfo[i].lat, EPInfo[i].lng],{icon:myIcon});
            marker.addTo(that.EPLayer);
            var points = document.getElementsByClassName('EPPoint');
            var point = points[points.length - 1];
            point.style.backgroundColor = EPInfo[i].color;
            if(flag) {
                (function(i,div){
                    setTimeout(function(){
                        div.innerHTML = '<span class="EPName">'+ EPInfo[i].name + '</span>';
                    },(i+1)*500);
                })(i,point);
            }
        }
    },
    addLabel: function(data) {
        for(var i = 0; i < data.length; i++) {
            var myIcon = L.divIcon({
                className:"EPName",
                iconSize: null,
                html: data[i].name
            });
            var marker = L.marker([data[i].lat, data[i].lng],{icon:myIcon});
            marker.addTo(this.method.EPLayer);
            var labels = document.getElementsByClassName('EPName');
            var label = labels[labels.length - 1];
            label.style.left = - (label.offsetWidth / 2) + 'px';
        }
    }
};
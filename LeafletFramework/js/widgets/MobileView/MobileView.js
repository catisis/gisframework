VitoGIS.MobileView = function (continerId) {
    this.currentIndex = 0;
    this.continerId = continerId;
    this.continer = L.DomUtil.get(continerId);
    this.article = L.DomUtil.create("section", "article", this.continer);
    L.DomUtil.setPosition(this.article, {x: 500, y: 10});
    this.panAnim = new L.PosAnimation();
}
VitoGIS.MobileView.prototype.setScene = function (index) {
    if (VitoGIS._currentBaseLayerConf.id != VitoGIS.MobileViewConf[index].mapId)
        VitoGIS.layerManager.changeBaseLayer(VitoGIS.MobileViewConf[index].mapId);
    if (!this.title) {
        this.title = L.DomUtil.create("H1", "title templete", this.article);
        this.content = L.DomUtil.create("H1", "content templete", this.article);
        this.describe = L.DomUtil.create("H2", "describe templete", this.article);
        this.title.innerHTML = VitoGIS.MobileViewConf[index].title;
        this.content.innerHTML = VitoGIS.MobileViewConf[index].content;
        this.describe.innerHTML = VitoGIS.MobileViewConf[index].describe;
        VitoGIS.mobileView.panAnim.run(this.article, {x: 10, y: 10});
    } else {
        VitoGIS.mobileView.panAnim.once('end', function (e) {
            //  L.DomUtil.setPosition( VitoGIS.mobileView.article, {x: 500, y: 10});
            VitoGIS.mobileView.title.innerHTML = VitoGIS.MobileViewConf[index].title;
            VitoGIS.mobileView.content.innerHTML = VitoGIS.MobileViewConf[index].content;
            VitoGIS.mobileView.describe.innerHTML = VitoGIS.MobileViewConf[index].describe;
            VitoGIS.mobileView.panAnim.run(VitoGIS.mobileView.article, {x: 10, y: 10});
        })
        VitoGIS.mobileView.panAnim.run(this.article, {x: -500, y: 10});
    }
    if (VitoGIS.MobileViewConf[index].location) {
        var icon = new L.icon({
            "iconUrl": "../image/poi/mobile3.png",
            "iconRetinaUrl":"../image/poi/mobile8.png",
            "shadowUrl": "../image/poi/marker-shadow.png",
            "shadowSize": [32, 47],
            "iconSize": [32, 47],
            "iconAnchor": [16, 47],
            "popupAnchor": [0, -40]
        });
        VitoGIS.query.zoomToPoints([VitoGIS.MobileViewConf[index].location], [VitoGIS.MobileViewConf[index].title], null, {icon: icon});
    } else {
        VitoGIS.map.zoomOut(5);
    }

}

VitoGIS.MobileView.prototype.nextScene = function () {
    if (this.currentIndex < VitoGIS.MobileViewConf.length) {
        this.setScene(this.currentIndex++)
    } else {
        this.currentIndex = 0;
        if (this.interval) {
            clearInterval(this.interval);
            L.DomUtil.get("nextBtn").style.display = "block";
            L.DomUtil.get("msgBtn").style.display = "block";
            this.interval = null;
            return;
        }
        this.setScene(this.currentIndex++);
    }
}

//VitoGIS.mobileView = new VitoGIS.MobileView("main");
//setTimeout(function () {
//    VitoGIS.mobileView.nextScene.call(VitoGIS.mobileView);
//}, 1000)
//VitoGIS.mobileView.interval = setInterval(function () {
//    VitoGIS.mobileView.nextScene.call(VitoGIS.mobileView);
//}, 10000);  //10秒循环调用执行remind()函数
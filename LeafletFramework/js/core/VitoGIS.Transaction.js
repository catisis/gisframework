/**
 *  绘制模块
 *  @module VitoGIS.Draw
 * */


/**
 * 提供对要素的在线编辑的入库操作
 * @Class VitoGIS.Transaction
 * @extends VitoGIS.Draw
 */
VitoGIS.Transaction = function (_this) {
    VitoGIS.Draw.call(this, _this);
}

VitoGIS.inherit(VitoGIS.Transaction, VitoGIS.Draw);


/**
 * 插入要素(OGC insert当前只支持一个元素的插入)
 * @method doInsert
 * @params {[Object]} property 保存字段
 * @params {[Object]} callback 回调函数
 * @params {[Object]} layerId? 如其名
 * */
VitoGIS.Transaction.prototype.doInsert = function (features, callback, layerId) {
    if (layerId) {
        this.layerManager._currentLayerId = layerId;
    }
    var conf = this.configManager.getFeatureLayersConf();
    if (!L.Util.isArray(features)) {
        var curFeature = [];
        switch (conf[this.layerManager._currentLayerId].geoType) {
            case "polygon":
                curFeature.push(new L.polygon(this.layerManager.drawLayer.getLayers()[0].getLatLngs()));
                break;
            case "polyline":
                curFeature.push(new L.polyline(this.layerManager.drawLayer.getLayers()[0].getLatLngs()));
                break;
            case "point":
                curFeature.push(new L.Marker(this.layerManager.drawLayer.getLayers()[0]._latlng));
                break;
        }
        curFeature[0].feature = {};
        curFeature[0].feature.properties = features;
    }
    switch (conf[this.layerManager._currentLayerId].serverType) {
        case "OGC":
            this._ogcInsert(curFeature, callback);
            break;
        case "Supermap":
            this._supermapInsert(curFeature, callback);
            break;
        case "Arcgis":
            this._arcgisInsert(curFeature, callback);
            break;
    }
}
VitoGIS.Transaction.prototype._arcgisInsert = function (features, callback) {
    var conf = this.configManager.getFeatureLayersConf()[this.layerManager._currentLayerId],
        temLayer = this._map._layers[conf.id] || null,
        task = new L.EsriTransation({
            url: conf.url
        });
    for (var i = 0; i < features.length; i++) {
        var upperCase = {}
        for (var item in features[i].feature.properties) {
            upperCase[item.toUpperCase()] = features[i].feature.properties[item]
        }
        features[i].feature.properties = upperCase;
    }
    var geoJSON = features[0].toGeoJSON();
    geoJSON.type = 'Feature';
    task.addFeature(geoJSON, function (e) {
        if (callback)
            callback(this);
        if (temLayer) {
            //  features[0].feature.id = value;
            this._setInfo(features[0]);
            this.addToMap(conf, features, temLayer)
            this.layerManager.drawLayer.clearLayers();
            features[0].openPopup()
        }
    }, this);
}

VitoGIS.Transaction.prototype._supermapInsert = function (features, callback) {
    var task = new L.SaveDraw({}),
        conf = this.configManager.getFeatureLayersConf()[this.layerManager._currentLayerId];
    temLayer = this._map._layers[conf.id] || null;

    /* for (var index in features) {
     features[index].addTo(temLayer);
     }*/
    for (var i = 0; i < features.length; i++) {
        var upperCase = {}
        for (var item in features[i].feature.properties) {
            upperCase[item.toUpperCase()] = features[i].feature.properties[item]
        }
        features[i].feature.properties = upperCase;
    }

    task.save(conf.editUrl, features, function (a, b, c, d) {
        if (b.length < 1) {
            console.log("数据请求错误")
            return;
        }
        if (callback)
            callback(this);
        if (temLayer) {
            features[0].feature.id = b[0];
            features[0].feature.properties.SMID = b[0];
            this._setInfo(features[0]);
            this.addToMap(conf, features, temLayer);
            this.layerManager.drawLayer.clearLayers();
            features[0].openPopup();
        }
    }, this)
}

VitoGIS.Transaction.prototype._ogcInsert = function (features, callback) {

    var task,
        conf = this.configManager.getFeatureLayersConf()[this.layerManager._currentLayerId],
        temLayer = this._map._layers[conf.id] || null;

    for (var i = 0; i < features.length; i++) {
        var upperCase = {}
        for (var item in features[i].feature.properties) {
            upperCase[item.toUpperCase()] = features[i].feature.properties[item]
        }
        features[i].feature.properties = upperCase;
    }
    var task = new L.WFSTransaction({
        typeNS: conf.nameSpace,
        typeName: conf.tableName,
        crs: L.CRS[conf.crs],
        geometryField: conf.geom_field || 'the_geom',
        netSP: conf.netSP
    })
    //TODO API将传入参数拓展后，对其修改,同时保存多个要素
    task.save(conf.url, features[0], "insert", function (data) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(data, 'text/xml');
        try {
            var value = this._getNodeValue_(xmlDoc, "ogc:FeatureId", "getAttribute");

            if (callback)
                callback(value);
            if (temLayer) {
                features[0].feature.id = value;
                this._setInfo(features[0]);
                this.addToMap(conf, features, temLayer)
                this.layerManager.drawLayer.clearLayers();
                features[0].openPopup()
            }
        } catch (e) {
            console.log(e);
            if (callback) {
                callback(false)
            }


        }


    }, this);
}
//===============================================================================================================================================================================
/**
 * 更新一条记录
 * @method doUpdate
 * @params {[Object]} property 保存字段
 * @params {[Object]} callback 回调函数
 * @params {[String]} layerId 需要修改的layerId
 * @params {[String?]} filter 过滤要素
 * @params {[Feature?]} feature 需要修改的要素
 * */
VitoGIS.Transaction.prototype.doUpdate = function (property, callback, layerId, filter, feature) {
    if (layerId)
        this.layerManager._currentLayerId = layerId;
    var curFeature = feature || {},
        conf = this.configManager.getFeatureLayersConf();
    if (filter) {
        curFeature.filter = filter;
        curFeature.isfilter = true;
        curFeature.feature = {};
        curFeature.feature.properties = {};
    } else {
        switch (conf[this.layerManager._currentLayerId].geoType) {
            case "polygon":
                curFeature = new L.polygon(this.currentThis._currentInfo.getLatLngs());
                break;
            case "polyline":
                curFeature = new L.polyline(this.currentThis._currentInfo.getLatLngs());
                break;
            case "point":
                curFeature = new L.Marker(this.currentThis._currentInfo._latlng);
                break;
        }
        curFeature.feature = this.currentThis._currentInfo.feature;
    }


    for (var item in property) {
        curFeature.feature.properties[item.toUpperCase()] = property[item];
    }
    //TODO 只有OGC这块这样实现了是不是有问题啊
    switch (conf[this.layerManager._currentLayerId].serverType) {
        case "OGC":
            this.ogcUpdate(curFeature, property, callback, filter);
            break;
        case "Supermap":
            this._supermapUpdate([curFeature], callback);
            break;
        case "Arcgis":
            this._arcgisUpdate(curFeature, callback);
            break;
    }

}

VitoGIS.Transaction.prototype._supermapUpdate = function (features, callback) {
    var task = new L.SaveDraw({}),
        conf = this.configManager.getFeatureLayersConf()[this.layerManager._currentLayerId];
    temLayer = this._map._layers[conf.id] || null;

    /* for (var index in features) {
     features[index].addTo(temLayer);
     }*/

    task.update(conf.editUrl, features, function (a, b, c, d) {

        if (b.length < 1) {
            console.log("数据请求错误")
            return;
        }
        if (callback)
            callback(this);
        if (temLayer) {
            if (b.succeed)
                features[0].feature.id = features[0].feature.properties.SMID;

            this.closeInfo();
            this.currentThis._currentInfo.unbindLabel();
            this._map._layers[this.layerManager._currentLayerId].removeLayer(this.currentThis._currentInfo.feature.id);
            this.addToMap(conf, features, temLayer);
            this._setInfo(features[0]);
            //
            //features[0].openPopup();
        }
    }, this)
}

VitoGIS.Transaction.prototype._arcgisUpdate = function (feature, callback) {
    var conf = this.configManager.getFeatureLayersConf()[this.layerManager._currentLayerId],
        temLayer = this._map._layers[conf.id] || null,
        task = new L.EsriTransation({
            url: conf.url
        });
    //for (var i = 0; i < features.length; i++) {
    var upperCase = {}
    for (var item in feature.feature.properties) {
        upperCase[item.toUpperCase()] = feature.feature.properties[item]
    }
    feature.feature.properties = upperCase;
    //}
    var geoJSON = feature.toGeoJSON();
    geoJSON.type = 'Feature';
    task.updateFeature(geoJSON, function (a, b, c, d) {
        if (callback)
            callback(this);
        if (temLayer) {
            ;
            //   currentThis._map._layers[this.id].removeLayer(VitoGIS._currentInfo._leaflet_id);
            this._map._layers[this.layerManager._currentLayerId].removeLayer(this.currentThis._currentInfo._leaflet_id);
            this.addToMap(conf, [feature], temLayer);
            this._setInfo(feature);
            this.closeInfo();
        }
    }, this);
}
//TODO where 参数多余了,可以并到其他的里面,代码需要整理
VitoGIS.Transaction.prototype.ogcUpdate = function (feature, property, callback, where) {

    // if (!layerId)
    var layerId = this.layerManager._currentLayerId;
    var conf = this.configManager.getFeatureLayersConf();
    var transaction = new L.WFSTransaction({
            typeNS: conf[layerId].nameSpace,
            typeName: conf[layerId].tableName,
            crs: L.CRS[conf[layerId].crs],
            geometryField: conf[layerId].geom_field || 'the_geom',
            netSP: conf[layerId].netSP
        }),
        currentConf = conf[layerId],
        currentThis = this;
    //通过Where获取要修改的元素
    var latlng = feature;
    latlng.where = where;
    for (var item in property) {
        latlng.feature.properties[item.toUpperCase()] = property[item]
    }

    transaction.save(conf[layerId].url, latlng, "update", function (data) {
        var result = {};
        var parser = new DOMParser();
        try {
            var xmlDoc = parser.parseFromString(data, 'text/xml');

            if (currentThis._getNodeValue(xmlDoc, "wfs:totalUpdated") > 0) {
                //判断是否传了feature过来
                if (latlng.where) {
                    // 如果没有弹出面板,则就只对数据做修改
                    if (this.currentThis._currentInfo) {
                        var content = this.currentThis._currentInfo._popup.getContent();

                        //更新完数据修改弹出窗口
                        for (var property in latlng.feature.properties) {
                            var oldStr = this.currentThis._currentInfo.feature.properties[property];
                            oldStr = oldStr == null ? "null" : "\"" + oldStr + "\"";
                            var str = encodeURI("\"" + property + "\"" + ":" + oldStr);
                            var replace = encodeURI("\"" + property + "\"" + ":" + "\"" + latlng.feature.properties[property] + "\"");
                            this.currentThis._currentInfo.feature.properties[property] = latlng.feature.properties[property];
                            content = content.replace(str, replace);

                        }
                        if (callback) {
                            callback(this);
                        }
                        this.currentThis._currentInfo._popup.setContent(content);
                    }

                    return;
                }
                this.closeInfo();
                this.currentThis._currentInfo.unbindLabel();
                this._map._layers[this.layerManager._currentLayerId].removeLayer(this.currentThis._currentInfo.feature.id);
                this.addToMap(this.currentConf, [latlng], currentThis._map._layers[this.layerManager._currentLayerId]);
                this._setInfo(latlng);

                if (callback) {
                    callback(this);
                }
            }
        }
        catch (e) {
            console.log(e);
            if (callback) {
                callback(false);
            }

        }

    }, this);
}
/**
 * 删除一条记录
 * @method doDelete
 * @params {[Object]} callback 回调函数
 * */
VitoGIS.Transaction.prototype.doDelete = function (callback) {
    switch (this.configManager.getFeatureLayersConf()[this.layerManager._currentLayerId].serverType) {
        case "OGC":
            this._ogcDelete(callback);
            break;
        case "Supermap":
            this._supermapDelete(callback);
            break;
        case "Arcgis":
            this._arcgisDelete(callback);
            break;
    }
    this.closeInfo();

}
VitoGIS.Transaction.prototype._arcgisDelete = function (callback) {
    var layerId = this.layerManager._currentLayerId;
    var conf = this.configManager.getFeatureLayerConf(layerId);
    var latlng = this.currentThis._currentInfo,
        task = new L.EsriTransation({
            url: conf.url
        });
    task.deleteFeature(latlng.feature.id, function (e) {
        this._map._layers[layerId].removeLayer(latlng._leaflet_id);
        if (callback) {
            callback(this);
        }
    }, this)
}
VitoGIS.Transaction.prototype._supermapDelete = function (callback) {
    var layerId = this.layerManager._currentLayerId;
    var latlng = this.currentThis._currentInfo;
    var task = new L.SaveDraw({});
    var conf = this.configManager.getFeatureLayersConf();
    task.delete(conf[layerId].editUrl, "[" + latlng.feature.id.toString().replace("smid", "") + "]", function (e) {
        this._map._layers[layerId].removeLayer(latlng.feature.id);
        if (callback) {
            callback(this);
        }
    }, this)
}

VitoGIS.Transaction.prototype._ogcDelete = function (callback) {
    var layerId = this.layerManager._currentLayerId;
    var conf = this.configManager.getFeatureLayersConf();
    var transaction = new L.WFSTransaction({
        typeNS: conf[layerId].nameSpace,
        typeName: conf[layerId].tableName,
        crs: L.CRS[conf[layerId].crs],
        geometryField: 'the_geom',
        netSP: conf[layerId].netSP
    })
    var latlng = this.currentThis._currentInfo;
    latlng.unbindLabel();
    var filter = new L.Filter.GmlObjectID();
    filter.append(latlng.feature.id);
    transaction.save(conf[layerId].url, filter, "remove", function (data) {
        var parser = new DOMParser();
        try {
            var xmlDoc = parser.parseFromString(data, 'text/xml');

            if (this._getNodeValue(xmlDoc, "wfs:totalDeleted") > 0) {
                this._map._layers[layerId].removeLayer(latlng);
                if (callback) {
                    callback(this);
                }
            }
        } catch (e) {
            console.log(e);
            if (callback) {
                callback(false);
            }
        }


    }, this);
}
VitoGIS.Transaction.prototype._getNodeValue = function (xmlDoc, nodeName) {
    var value = ""
    var xml = xmlDoc.children[0].children[0];
    for (var i in xml.childNodes) {
        if (xml.childNodes[i].nodeName == nodeName)
            return xml.childNodes[i].textContent;
    }
    return null
}
VitoGIS.Transaction.prototype._getNodeValue_ = function (xmlDoc, nodeName, method) {
    if (!method) {
        method = "textContent";
    }
    for (var i = 0; i < xmlDoc.children.length; i++) {
        if (xmlDoc.children[i].children.length > 0) {
            var value = this._getNodeValue_(xmlDoc.children[i], nodeName, method);
            if (value)
                return value;
        }
        if (xmlDoc.children[i].nodeName == nodeName) {
            var tem;
            if (method == "textContent")
                tem = xmlDoc.children[i].textContent;
            else if (method == "getAttribute")
                tem = xmlDoc.children[i].getAttribute("fid");
            return tem;
        }
    }
    return null;
}

//VitoGIS.draw = new VitoGIS.Draw(VitoGIS.map);

//VitoGIS.draw = new VitoGIS.Transaction(VitoGIS.map);


/**
 * Created by bk on 2017/2/27.
 */
var mongoose = require('./db.js'),
    Schema = mongoose.Schema;

var MapConfSchema = new Schema({
    _id: {type: String},
    _class: {type: String},
    mapinit: {type: String},                         //配置文件
    createtime : { type: Date },                        //标题
    createuser: {type: String},
    maptitle: {type: String},
    isDefault: {type: String}
});

module.exports = mongoose.model('vitoconfig',MapConfSchema,'vitoconfig');
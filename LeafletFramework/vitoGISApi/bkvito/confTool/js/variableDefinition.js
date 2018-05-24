/**
 * Created by DFC on 2016/5/26.
 */
var Area = {}; //区分不同的地区
var AreaChinese = {}; //记录地区对应的中文名

window["confUrl"] = {}; //存放ConfUrl.json文件的内容
window["confiugure"] = {};
window["jsonData"] = {}; //存放所有的配置文件内容
window["validData"] = {}; //存放页面中勾选中的配置文件的内容（存放最终的结果）
var confType = {};
confType["title"] = []; //存放需要配置的文件种类，控制artContainer模块在页面中出现的次数
confType["list"] = []; //给title的每一项添上中文
var confData = [];
var confName = {}; //存放每个种类所包含的的配置文件的类名和title

//var mapUrlRe = /[a-zA-z]+:\/\/[^\s]*\:[0-9]*/; //截取mapUrl
var mapUrlRe = /[a-zA-z]+:\/\/[^\s]*\:[0-9]+\//; //截取mapUrl
var featureUrlRe = /\?[a-zA-z]+:\/\/[^\s]*\:[0-9]*/;
var openNewPage = true; //判断是否打开新的页面展示生成的json数据，true为打开新页面，false则不打开
var checkInputValue = /^(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\:[0-9]+$/; //验证在input框中输入的地址是否是127.0.0.1:8080的格式
var getIP = /(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\:[0-9]+/; //截取字符串中的ip地址

var nameSpace = "";

var description = {};

var updateID = 0;
var maptitle = "";
var fCRS = {}; // 图层的参考坐标系。注：一个项目的所有图层的参考坐标系必须一致，否则，这就是bug。
var fNetSP = {}; // 图层的命名空间uri

var ctx = parent.__ctx;
var widgetsID = {};

var defaultIP = {}; //存放每个项目在研发阶段底图和图层的ip地址
var level = {}; //存放每个项目，区县、街道、社区、网格、楼宇图层的自动查询级别
var netMap = ['baidu','openTreeMap','tianditu','amap']; // 互联网地图
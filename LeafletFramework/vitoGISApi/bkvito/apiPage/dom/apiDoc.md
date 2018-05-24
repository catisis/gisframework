
#####展示地图
* [示例](#示例)
* [初始化方法](#初始化方法)
#####地图事件
* [监听方法](#监听方法)
* [事件](#事件)
#####地图状态
* [获取地图状态方法](#获取地图状态方法)
* [修改地图状态方法](#修改地图状态方法)
#####图层
* [获取图层状态方法](#获取图层状态方法)
* [修改图层状态方法](#修改图层状态方法)
* [移出图层自动查询方法](#移出图层自动查询方法)

#####绘制
* [绘制点线面](#绘制点线面)
* [添加要素](#添加要素)
* [删除要素](#删除要素)
* [更改要素属性](#更改要素属性)

#####插件
* [测距](#测距)
* [测面](#测面)
* [街景](#街景)
* [轨迹](#轨迹)
#####配置文件
* [配置文件方法示例](#配置文件方法示例)
* [获取配置文件](#获取配置文件)
* [修改配置文件](#修改配置文件)
#####JSON参数配置
* [底图参数](#底图参数)
* [要素参数](#要素参数)
* [面板参数](#面板参数)
* [面板属性](#面板属性)
* * *

#####示例
```
//初始化地图，读取配置文件中的参数，用来配置地图的显示效果
VitoGIS.init("conf_showMap.json",function(e){
            window.gis = e;//将框架中的方法赋值给全局变量gis
        });
```
#####初始化方法
方法  | 描述 
-----|------
 VitoGIS.init( url:String,callback);   |  根据读取的配置文件将地图初始化在id为map的div中。未进行初始化，地图将不能显示。回调函数的参数将会包含框架的所有的方法。



#####监听方法
```
gis.Events.on(type:String, callback);//type是监听事件的类型
```
#####事件
事件          |    参数            |  描述
-----        |------              |------
MAPCLICK     | {type,latlng}      | 左键单击地图时触发此事件。
MAPDBCLICK   | {type,latlng}      | 左键双击地图时触发此事件。
RIGHTCLICK   | {type,latlng}      | 右键单击地图时触发此事件。
ZOOMCHANGE   | {type,zoom}        | 缩放地图后触发此事件。
MOVECHANGE   | {type}             | 移动地图后触发此事件。
DRAWEND      | {type,layerType,layer} | 绘制结束后触发此事件。

**注意:**
 1. 1.单击和双击事件冲突
 2. 2.缩放地图后也将会触发MOVECHANGE事件

#####获取地图状态方法
方法          |    返回值           |  描述
-----        |------              |------
getBounds()  |       Object       | 返回地图可视区域，以地理坐标表示。
getCenter()  |       Object 	  | 返回地图当前中心点。
getZoom()    |	     Number	      | 返回地图当前缩放级别。
#####修改地图状态方法
方法                        |    返回值           |  描述
-----                      |------              |------
setCenter()                |       none       	  | 将地图移动到中心点。
setZoom(zoom:Number)       |	   none	          | 将地图缩放到指定级别。
changeBaseLayer(id:String) |       none           | 切换不同的底图。

#####获取图层状态方法
方法                    |    返回值           |  描述
-----                  |------              |------
getCurrentLayerConf()|  Object | 返回当初图层的配置信息。
getCutLyId()           |  String | 返回当前图层的Id。
doQuery()               |   none  | 查询出指定图层的要素。
zoomToWKT()                    |   none  | 显示指定要素的位置
#####修改图层状态方法
方法                        |    返回值           |  描述
-----                      |------              |------
cleanAll()                 |       none         | 清除当前所有图层。
closeAll()                     |    none  	  | 关闭当前所有图层。
cleanLayer(name:String)     |  none           | 清除当前所有图层
openLayer(featureId:String) |    none      | 显示指定的图层。
addToMap(options:Object, features:Object,layer:FeatureGroup) | FeatureGroup | 要素添加到图层,并且返回当前图层 
closeInfo ()                |  none | 关闭InfoWindow
setCutLyId(id:String)       | none  | 设置当前矢量图图层的id
#####移出图层自动查询方法
方法                        |    返回值           |  描述
-----                       |------               |------
offAutoQuery(id:String)     |  none               | 移除自动查询事件
offAllAutoQuery()           |  none               | 移除所有自动查询事件
#####绘制点线面
```
gis.draw.active(type:String, isListen:Boolean);
//type有point、polyline、polygon三个值，分别表示点、线、面。
//isListen表示是否给绘制的要素绑定弹出窗口。
```
#####添加要素
```
gis.draw.doInsert(layer:Object, callback);
//layer的属性是存储图层必须的字段。
```
#####删除要素
```
gis.draw.doDelete(callback);
 //删除的是最后被操作的要素
```
#####更改要素属性
```
gis.draw.doUpdate(property:Object, callback,layer:String, featureId:String,feature);
//给property对象的属性赋值来完成更改被点击的元素
//layer是当前图层名
//featureId是"ID = ("+e.properties.ID+")"
// feature是undefined
```


#####测距
```
gis.tools.measureLength();
```
#####测面
```
gis.tools.measureArea();
```
**注意:**工具插件依赖坐标转换插件
#####街景
```
gis.jiejing.get();//坐标转换插件的配置的参考点坐标必须正确
```
#####轨迹
```
gis.routeplayer.initRoute(featureArr, true);
```


#####配置文件方法示例
```
gis.mapManager.configManager.getBaseLayerConf();
或
gis.layerManager.configManager.getBaseLayerConf();
```
#####获取配置文件
方法                        |    返回值           |  描述
-----                      |------              |------
getBaseLayerConf()         |      Object        | 获取配置文件中，底图的配置内容
getFeatureLayerConf(id:String [,Conf:Object])|      Object        | 获取指定要素的配置内容
getFeatureLayersConf()     |      Object        | 获取所有要素的配置内容
getDivConf()               |      Object        | 获取所有面板的配置内容
getWidgetsConf()           |      Object        | 获取所有插件的配置内容
getInvisibleFLayaersConf() |      Object        | 获取要素配置内容,并将Visible属性置为false
#####修改配置文件
方法                               |    返回值      |  描述
-----                             |------         |------
setBaseLayerConf(value:Object)    |    none       | 设置底图配置文件
setFeatureLayersConf(value:Object)|    none       | 设置图层配置文件
setWidgetsConf(value:Object)      |    none       | 设置组件配置文件
setDivConf(value:Object)          |    none       | 设置弹出窗配置文件


#####底图参数

属性       |    描述            |  类型
-----     |------             |------
id        |  地图id            | String
title     |  地图名            | String
mapUrl    | 地图服务地址        | String
labelUrl  |                   | String
subdomains|                   | Array
maxZoom   | 地图可缩放的最大级别 | Int
minZoom   | 地图可缩放的最小级别 | Int
crs       | 坐标参照系          | Array|String
visible   | 是否显示这张地图（如果配置了多张地图，只能有一个为true） |  Boolean
center    | 地图中心点          |  数组
initLevel | 地图的初始级别       | Int

#####要素参数
属性         |    描述            |  类型
-----       |------              |------
isShow      |  是否显示在层级按钮中 | Boolean
isDraw      |  是否可以绘制这个要素 | Boolean
geom_field  |                    | String
crs         | 参考坐标系          | String
netSP       | 命名空间Uri         | String
nameSpace   | 命名空间            | String
defaultStyle| 要素默认显示的样式   | Object
serverType  | 地图服务类型        | String
labelField  | 要素的文字标签       | String
info        | 对象的面板          | String
visible     | 是否显示图层        | Boolean
filter      | 筛选条件            | String
tableName   | 数据存在的表名       | String
resource    |                   | String
auto        | 是否自动查询        | String
title       | 要素名称            | String
minZoom     | 自动查询的最小级别    | Int
defaultZoom | 显示图层时地图的默认级别 | Int
url         | 图层发布的地址       | String
passStyle   | 通过后的样式         | Object
geoType     | 图层的形状类型       | String
maxZoom     | 自动查询的最大级别

**注意:**

1. 1.点和面的defaultStyle，passStyle的设置有区别。
2. 2.auto和minZoom，maxZoom一起实现自动查询要素的功能。
```
  if(auto) {
	　if(currentZoom>=minZoom && currentZoom<maxZoom) {
	　　 //查询要素...
	　}
　}
```
#####面板参数

属性         |    描述                   |  类型
-----       |------                    |------
title       | 对应的图层                 | String
passPage    | 要素不同状态下显示不同的页面  | Object
defaultPage | 要素不同状态下显示不同的页面  | Object
editPage    | 要素不同状态下显示不同的页面  | Object

#####面板属性(passPage,defaultPage,editPage的属性)
属性         |    描述                   |  类型
-----       |------                    |------
title       |  面板名称                 | String
url         |  应用的页面               | String
width       |  面板宽                   | Int
height      |  面板高                   | Int
panelFrame  |  面板边框页面              | String
## 基于拓展后的Leaflet,实现能够快速搭建项目的框架试组建
    
    1.框架通过配置文件主导搭建
    2.组建化的框架,能够支持实例化多个
    
配置文件由三部分组成  
 
    |--baseLayerConf         底图配置部分
    |
    |--featureLayersConf     要素配置部分
    |
    |--widgetsConfig         组件配置部分
    |
    |--divConfig             弹出窗口配置部分
    
    以下依次详细说明:
        
        baseLayerConf------|------------------------------------------------------
                           |-----   title-----------String类型-----底图标题
                           |-----   mapUrl----------String类型-----切片地图地址
                           |-----   labelUrl--------String类型-----切片地图Label地址
                           |-----   subdomains------Array 类型-----切片地图集群地址
                           |-----   maxZoom---------Number类型-----能加载的最大级别
                           |-----   minZoom---------Number类型-----能加载的最小级别
                           |-----   crs-------------String类型-----配置好的crs
                           |-----   visible---------Boolen类型-----初始化是否显示
                           |-----   center----------Array 类型-----初始化中心点坐标
                           |-----   initLevel-------Number类型-----初始化级别
                           |-------------------------------------------------------
                       
        
        
        featureLayersConf--|---------------------------------------------------------------------------------
                           |-----   serverType-----String类型----服务类型(OGC||Supermap||Arcgis)
                           |-----   url------------String类型----服务地址
                           |-----   tableName------String类型----表名
                           |-----   nameSpace------String类型----命名空间
                           |-----   info-----------String类型----弹出窗口
                           |-----   visible--------Boolen类型----初始化是否显示
                           |-----   title----------String类型----名称
                           |-----   geoType--------String类型----要素类型(Point,Polyline,Polygon)
                           |-----   geom_field-----String类型----空间字段对应的类型
                           |-----   crs------------String类型----定义的CRS类
                           |-----   maxZoom--------Number类型----最大显示级别(当auto设置成"true"时才有用)
                           |-----   minZoom--------Number类型----最小显示级别(当auto设置成"true"时才有用)
                           |-----   defaultStyle---Object类型----当ISBUSINE字段为"0",或者没有时的样式类型,下面会详细说明
                           |-----   passStyle------Object类型----当ISBUSINE字段为"1",下面会详细说明
                           |-----   filter---------String类型----Where语句,目前只实现了 "xxx" in (xxxx,xx)的句式
                           |-----   auto-----------Boolen类型----是否只加载当前屏幕图层
                           |-----   netSP----------String类型----命名空间uri(WFS图层专属)
                           |-----------------------------------------------------------------------------------
                           | 
                           |                        _______________________________________________________________
                           |     |---PointStyle-----|-----iconUrl-------String类型------图片url
                           |-----|                  |-----iconAnchor----Array 类型------图片偏移数组[上下偏移,左右便宜]
                           |     |                  |-----popupAnchor---Array 类型------弹出窗偏移[上下偏移,左右便宜]
                           |     |                  |-----iconSize------Array 类型------图片大小[宽,高]
                           |     |                  ---------------------------------------------------------------
                           |     |                  ————————————————————————————————————————————————————————————————
                           |     |---polygonStyle---|-----fillOpacity---Number类型------填充颜色透明度0~1的一个数字
                           |     |                  |-----opacity-------Number类型------整体透明度0~1的一个数字
                           |     |                  |-----fillColor-----String类型------填充颜色类型
                           |     |                  ----------------------------------------------------------------
                           |     | 
                           |     |                  ————————————————————————————————————————————————————————————————
                           |     |---polyLineStyle--|-----fillOpacity---Number类型------填充颜色透明度0~1的一个数字
                           |                        |-----opacity-------Number类型------整体透明度0~1的一个数字
                           |                        |-----fillColor-----String类型------填充颜色类型
                           |                        ----------------------------------------------------------------
                           ——------------------------------------------------------------------------------------------
                           
                           
        widgetsConfig------|------------------------------------------------------
                           |-----   widgetUrl-----String类型-----组件地址
                           |-----   widgetConf----String类型-----组件配置文件
                           |-----   widgetCSS-----String类型-----组件css
                           |-----   isUse---------Boolen类型-----是否加载这个组件
                           |-------------------------------------------------------
                           
                           
        divConfig------    |------------------------------------------------------
                           |-----   passPage-------Object类型-----ISBUSINE字段为"1"时弹出的面板
                           |-----   defaultPage----Object类型-----ISBUSINE字段为"0"时弹出的面板
                           |-----   editPage-------Object类型-----绘制完成后弹出的面板
                           |-------------------------------------------------------
                           |
                           |-------page-------|--------————————————————————————————————————
                           |                  |--------title-----String类型
                           |                  |--------width-----Number类型  
                           |                  |--------height----Number类型  
                           |                  |--------url-------String类型  
                           -——————————————————————————————————————————————————————————————
                           
##示例配置文件
    {
      "baseLayerConf": {
        "amap": {
          "id": "amap",
          "title": "高德地图",
          "mapUrl": "http://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}",
          "labelUrl": "",
          "subdomains": [
            "01",
            "02",
            "03",
            "04"
          ],
          "maxZoom": 18,
          "minZoom": 4,
          "crs": "EPSG900913",
          "visible": true,
          "center": [39.90723531552726, 116.37708153724076],
          "initLevel": 15
        }
    
      },
      "featureLayersConf": {
        "Base_Org": {
          "id":"Base_Org",
          "url": "http://192.168.0.172:6080/arcgis/rest/services/Base_Org/FeatureServer/0",
          "tableName": "D_Building",
          "visible": false,
          "title": "楼宇",
          "info": "View",
          "geoType": "polygon",
          "serverType": "Arcgis",
          "crs": "UNKNOWN",
          "maxZoom": 18,
          "minZoom": 15,
          "defaultStyle": {
            "fillOpacity": 0,
            "opacity": 0.1,
            "fillColor": "#CD4F39"
          },
          "passStyle": {
            "fillOpacity": 0,
            "opacity": 0.1,
            "fillColor": "#000000"
          },
          "filter": "",
          "auto": true
        }
      },
      "widgetsConfig": {
        "Tools": {
          "id":"Tools",
          "widgetUrl": "/../widgets/Tools/Tools.js",
          "widgetConf": "/../widgets/Tools/ToolsConf.json",
          "isUse": false
        },
        "Overview": {
          "id":"Overview",
          "widgetUrl": "/../widgets/Overview/Overview.js",
          "widgetConf": "/../widgets/Overview/OverviewConf.json",
          "widgetCSS": "/../widgets/Overview/Overview.css",
          "isUse": false
        }
      },
      "divConfig": {
        "View": {
          "title": "人员管理",
          "passPage": {
            "url": "panel/partymemberPanel.html",
            "width": 450,
            "height": 400
          },
          "defaultPage": {
            "url": "../map/theme/template/template.html",
            "width": 450,
            "height": 400
          },
          "editPage": {
            "url": "../map/theme/template/template.html",
            "width": 450,
            "height": 400
          }
        }
      }
    }
    
###示例代码
    <!DOCTYPE html>
    <html>
    <head lang="en">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Fully customizable and responsive CSS grids.">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">
    
        <title></title>
        //css地址
        <link rel="stylesheet" href="../dist/leaflet.css"/>
        //css地址 设置容器的宽和高
        <style>
              html, body, #map {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
              }
        </style>
        //FrameWork地址
        <script type="text/javascript" src="../dist/VitoGISFramework.js"></script>
    
    </head>
    <body onload="init()">
    <div id="map"></div>
    </div>
    <script>
        function init() {
            VitoGIS.init("../conf_inner.json",function(e){
                //此处时回调函数
            });
        }
    </script>
    </body>
    </html>
###Leaflet 个人版

    公司对项目有个性话的需求,做了一些个性化的修改
    
####添加了一些功能如下:
#####第一部分 查询
  
    1.添加了对国内超图地图的支持,主要是对"要素地图服务",类似于WFS这种的.能够对数据进行,查询,修改,删除.
    
    2.添加了对WFS的支持,网上之前有对WFS的支持,但是他是将WFS定义为一个图层来做的,我这块不希望定义为图层,
    因为如果是单纯的定义为图层肯能不够灵活导致的问题就是,如果是很多要素加载的话,页面会和卡,所以我这里将它
    定义为查询的话,一次查询出来多少数据要现实,就变的灵活了.
    
    3.对Arcgis添加了支持,也是针对FeatureService而言的,在项目中使用Arcgis拓展的FeatureService功能也
    是觉得如果数据量大的情况下不好控制,所以做成了查询,然后让用户再更具自己的需求去查询数据.
    
#####第二部分 插件添加
    
    项目当中也需要一些常规功能如:绘制,坐标转换,Label,轨迹播放,手机端的定位,对wkt的支持,查询组件等.
    
        绘制功能采用[https://github.com/Leaflet/Leaflet.draw].
    
        坐标转换采用[https://github.com/kartena/Proj4Leaflet].
    
        Lable功能采用[https://github.com/Leaflet/Leaflet.label].
    
        轨迹播放功能采用[https://github.com/openplans/Leaflet.AnimatedMarker],这个功能是借鉴了他的,然后自改了好多的东西,已经面目全非了.
    
        手机端定位功能采用[https://github.com/domoritz/leaflet-locatecontrol].
        
        wkt功能采用[https://github.com/arthur-e/Wicket].
    
        查询组件采用[https://github.com/smeijer/L.GeoSearch],这个组件中添加了百度的查询.
        
####第三部分 地图Bug修改

    有一些leaflet没有修改的Bug,简单的并没有影像到其他部分的前提下,这里做了简单的修改.
    
####第四部分 针对添加插件,增加了示例代码,在debug当中
    
    
    
    
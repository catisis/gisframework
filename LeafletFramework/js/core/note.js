
/**
 *  配置文件说明
 *  @module Config
 * */
/**
 * 要素配置
 * @class VitoGIS.featureLayersConf
 *
 * */


/**
 * featureLayer 的唯一标识
 * @property {[String]} id
 * */

/**
 * 底图标题
 * @property {[String]} title
 * */
/**
 * "Supermap"或"OGC" 当前支持这两种类型，OGC 为 WFS,
 * @property {[String]} serverType
 * */
/**
 * 服务地址
 *  @property {[String]} url
 * */
/**
 * 编辑图层的服务地址（该地址为超图特有，对OGC图层则无效）
 * @property {[String]} editUrl
 * */
/**
 * 表名超图如："D_building@SUPERMAP_DY"  ‘@’后面为命名空间，OGC的服务则部将命名空间写入tablename
 *  @property {[String]} tableName
 * */
/**
 * 命名空间如： "postgis",只用OGC图层将命名空间写在此(此配置日后将统一)
 * @property {[String]} nameSpace
 * */
/**
 *  默认弹出窗口配置名 在 “divConfig” 这个对象中定义了索引
 *@property {[String]} defaultInfo
 * */
/**
 * 审核通过的弹出窗口配置名 在 “divConfig” 这个对象中定义了索引
 * @property {[String]} passInfo
 * */
/**
 * 图层的几何类型分为点，线，面分别为：point,polygon,polyline
 *  @property {[String]} geoType
 * */
/**
 *  用于绑定弹出业务面板
 *@property {[String]} resource
 * */
/**
 * 坐标系定义有 ： EPSG900913，GCJ02，UNKNOWN
 *@property {[String]} crs
 * */
/**
 *  当 auto 为 ture 改属性生效，显示该图层的最大级别，大于该级别则不显示
 * @property {[Number]} maxZoom
 * */
/**
 * 默认显示该图层的样式
 * @property {[Object]} defaultStyle
 * */
/**
 *  审核通过的显示样式
 * @property {[Object]} passStyle
 * */
/**
 * 通过此sql可以过滤一部分图层 格式如："shenhe in (1)"  则显示shenhe = 1 的要素
 *@property {[String]} filter
 * */
/**
 * 是否自动显示要素，该方法为展示当前屏幕内的要素，目的是为了缓解大量要素一次性加载带来的显示压力
 * @property {[Boolen]} auto
 * */
/**
 * OGC发布工作空间时需要定义工作空间的值，该值通常为一个URL 如："http://www.baidu.com" ( OGC图层专有)
 * @property {[String]} netSP
 * */





/**
 * 底图配置
 * @class VitoGIS.baseLayerConf
 *
 * */
/**
 *  底图id
 *@property {[String]} id
 * */
/**
 * 底图标题
 *@property {[String]} title
 * */
/**
 * 切片图层服务地址
 *@property {[String]} mapUrl
 * */
/**
 * 切片图层标注服务地址
 *@property {[String]} labelUrl
 * */
/**
 * 切片集群子域
 *@property {[Array]} subdomains
 * */
/**
 * 最大放大等级
 *@property {[Number]} maxZoom
 * */
/**
 * 最小放大等级
 *@property {[Number]} minZoom
 * */
/**
 * 坐标系，当前支持：EPSG900913(WebMecator,用于高德，百度，腾讯，谷歌等互联网底图)，EPSG4326(WGS84)，UNKNOWN（超图未定义坐标发布切片时所使用）
 *@property {[String]} crs
 * */
/**
 *  默认初始化中心点
 *@property {[Array]} center
 * */
/**
 *  默认初始缩放等级
 *@property {[Number]} initLevel
 * */
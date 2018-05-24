var deps = {
    Core: {
        src: ['VitoGIS.js',
            'core/Util.js',
            'core/Class.js',
            'core/Events.js',
            'core/Browser.js',
            'geometry/Point.js',
            'geometry/Bounds.js',
            'geometry/Transformation.js',
            'dom/DomUtil.js',
            'geo/LatLng.js',
            'geo/LatLngBounds.js',
            'geo/projection/Projection.LonLat.js',
            'geo/projection/Projection.SphericalMercator.js',
            'geo/crs/CRS.js',
            'geo/crs/CRS.Simple.js',
            'geo/crs/CRS.Earth.js',
            'geo/crs/CRS.EPSG3857.js',
            'geo/crs/CRS.EPSG4326.js',
            'map/Map.js',
            'layer/Layer.js'
        ],
        desc: 'The core of the library, including OOP, events, DOM facilities, basic units, projections (EPSG:3857 and EPSG:4326) and the base Map class.'
    },
    Request: {
        src: ['core/Request.js'],
        desc: '为query组件提供支持',
        heading: 'http请求'
    },

    EPSG3395: {
        src: ['geo/projection/Projection.Mercator.js',
            'geo/crs/CRS.EPSG3395.js'],
        desc: 'EPSG:3395 projection (used by some map providers).',
        heading: 'Additional projections'
    },

    GridLayer: {
        src: ['layer/tile/GridLayer.js'],
        desc: 'Used as base class for grid-like layers like TileLayer.',
        heading: 'Layers'
    },

    TileLayer: {
        src: ['layer/tile/TileLayer.js'],
        desc: 'The base class for displaying tile layers on the map.',
        deps: ['GridLayer']
    },

    TileLayerWMS: {
        src: ['layer/tile/TileLayer.WMS.js'],
        desc: 'WMS tile layer.',
        deps: ['TileLayer']
    },

    ImageOverlay: {
        src: ['layer/ImageOverlay.js'],
        desc: 'Used to display an image over a particular rectangular area of the map.'
    },

    Marker: {
        src: ['layer/marker/Icon.js',
            'layer/marker/Icon.Default.js',
            'layer/marker/Marker.js'],
        desc: 'Markers to put on the map.'
    },

    DivIcon: {
        src: ['layer/marker/DivIcon.js'],
        deps: ['Marker'],
        desc: 'Lightweight div-based icon for markers.'
    },

    Popup: {
        src: [
            'layer/Popup.js',
            'layer/Layer.Popup.js',
            'layer/marker/Marker.Popup.js'
        ],
        deps: ['Marker'],
        desc: 'Used to display the map popup (used mostly for binding HTML data to markers and paths on click).'
    },

    LayerGroup: {
        src: ['layer/LayerGroup.js'],
        desc: 'Allows grouping several layers to handle them as one.'
    },

    FeatureGroup: {
        src: ['layer/FeatureGroup.js'],
        deps: ['LayerGroup', 'Popup'],
        desc: 'Extends LayerGroup with mouse events and bindPopup method shared between layers.'
    },


    Path: {
        src: [
            'layer/vector/Renderer.js',
            'layer/vector/Path.js'
        ],
        desc: 'Vector rendering core.',
        heading: 'Vector layers'
    },

    Polyline: {
        src: ['geometry/LineUtil.js',
            'layer/vector/Polyline.js'],
        deps: ['Path'],
        desc: 'Polyline overlays.'
    },

    Polygon: {
        src: ['geometry/PolyUtil.js',
            'layer/vector/Polygon.js'],
        deps: ['Polyline'],
        desc: 'Polygon overlays.'
    },

    Rectangle: {
        src: ['layer/vector/Rectangle.js'],
        deps: ['Polygon'],
        desc: ['Rectangle overlays.']
    },

    CircleMarker: {
        src: ['layer/vector/CircleMarker.js'],
        deps: ['Path'],
        desc: 'Circle overlays with a constant pixel radius.'
    },

    Circle: {
        src: ['layer/vector/Circle.js'],
        deps: ['CircleMarker'],
        desc: 'Circle overlays (with radius in meters).'
    },

    SVG: {
        src: ['layer/vector/SVG.js'],
        deps: ['Path'],
        desc: 'SVG backend for vector layers.'
    },

    VML: {
        src: ['layer/vector/SVG.VML.js'],
        deps: ['SVG'],
        desc: 'VML fallback for vector layers in IE7-8.'
    },

    Canvas: {
        src: ['layer/vector/Canvas.js'],
        deps: ['CircleMarker', 'Path', 'Polygon', 'Polyline'],
        desc: 'Canvas backend for vector layers.'
    },

    GeoJSON: {
        src: ['layer/GeoJSON.js'],
        deps: ['Polygon', 'Circle', 'CircleMarker', 'Marker', 'FeatureGroup'],
        desc: 'GeoJSON layer, parses the data and adds corresponding layers above.'
    },


    MapDrag: {
        src: ['dom/DomEvent.js',
            'dom/Draggable.js',
            'core/Handler.js',
            'map/handler/Map.Drag.js'],
        desc: 'Makes the map draggable (by mouse or touch).',
        heading: 'Interaction'
    },

    MouseZoom: {
        src: ['dom/DomEvent.js',
            'core/Handler.js',
            'map/handler/Map.DoubleClickZoom.js',
            'map/handler/Map.ScrollWheelZoom.js'],
        desc: 'Scroll wheel zoom and double click zoom on the map.'
    },

    TouchZoom: {
        src: ['dom/DomEvent.js',
            'dom/DomEvent.DoubleTap.js',
            'dom/DomEvent.Pointer.js',
            'core/Handler.js',
            'map/handler/Map.TouchZoom.js',
            'map/handler/Map.Tap.js'],
        deps: ['AnimationZoom'],
        desc: 'Enables smooth touch zoom / tap / longhold / doubletap on iOS, IE10, Android.'
    },

    BoxZoom: {
        src: ['map/handler/Map.BoxZoom.js'],
        deps: ['MouseZoom'],
        desc: 'Enables zooming to bounding box by shift-dragging the map.'
    },

    Keyboard: {
        src: ['map/handler/Map.Keyboard.js'],
        desc: 'Enables keyboard pan/zoom when the map is focused.'
    },

    MarkerDrag: {
        src: ['layer/marker/Marker.Drag.js'],
        deps: ['Marker'],
        desc: 'Makes markers draggable (by mouse or touch).'
    },

    ControlZoom: {
        src: ['control/Control.js',
            'control/Control.Zoom.js'],
        heading: 'Controls',
        desc: 'Basic zoom control with two buttons (zoom in / zoom out).'
    },

    ControlAttrib: {
        src: ['control/Control.js',
            'control/Control.Attribution.js'],
        desc: 'Attribution control.'
    },

    ControlScale: {
        src: ['control/Control.js',
            'control/Control.Scale.js'],
        desc: 'Scale control.'
    },

    ControlLayers: {
        src: ['control/Control.js',
            'control/Control.Layers.js'],
        desc: 'Layer Switcher control.'
    },

    AnimationPan: {
        src: [
            'dom/DomEvent.js',
            'dom/PosAnimation.js',
            'map/anim/Map.PanAnimation.js'
        ],
        heading: 'Animation',
        desc: 'Core panning animation support.'
    },

    AnimationZoom: {
        src: [
            'map/anim/Map.ZoomAnimation.js',
            'map/anim/Map.FlyTo.js'
        ],
        deps: ['AnimationPan'],
        desc: 'Smooth zooming animation. Works only on browsers that support CSS3 Transitions.'
    },

    Geolocation: {
        src: ['map/ext/Map.Geolocation.js'],
        desc: 'Adds Map#locate method and related events to make geolocation easier.',
        heading: 'Misc'
    },

    Proj: {
        src: [
            'proj/proj4-compressed.js',
            'proj/proj4leaflet.js',
            'proj/chinaProj.js'
        ],
        desc: '坐标系拓展，添加proj4的支持,添加中国常用坐标系的支持',
        heading: '拓展'
    },

    DrawCore: {
        src: [
            'draw/Leaflet.draw.js'
        ],
        desc: 'The core of the plugin. Currently only includes the version.',
        heading: '绘制'
    },
    DrawHandlers: {
        src: [
            'draw/draw/handler/Draw.Feature.js',
            'draw/draw/handler/Draw.Polyline.js',
            'draw/draw/handler/Draw.Polygon.js',
            'draw/draw/handler/Draw.SimpleShape.js',
            'draw/draw/handler/Draw.Rectangle.js',
            'draw/draw/handler/Draw.Circle.js',
            'draw/draw/handler/Draw.Marker.js'
        ],
        desc: 'Drawing handlers for: polylines, polygons, rectangles, circles and markers.',
        deps: ['DrawCore']
    },

    EditHandlers: {
        src: [
            'draw/edit/handler/Edit.Marker.js',
            'draw/edit/handler/Edit.Poly.js',
            'draw/edit/handler/Edit.SimpleShape.js',
            'draw/edit/handler/Edit.Rectangle.js',
            'draw/edit/handler/Edit.Circle.js'
        ],
        desc: 'Editing handlers for: polylines, polygons, rectangles, and circles.',
        deps: ['DrawCore']
    },

    Extensions: {
        src: [
            'draw/ext/LatLngUtil.js',
            'draw/ext/GeometryUtil.js',
            'draw/ext/LineUtil.Intersect.js',
            'draw/ext/Polyline.Intersect.js',
            'draw/ext/Polygon.Intersect.js'
        ],
        desc: 'Extensions of leaflet classes.'
    },

    CommonUI: {
        src: [
            'draw/Control.Draw.js',
            'draw/Toolbar.js',
            'draw/Tooltip.js'
        ],
        desc: 'Common UI components used.',
        deps: ['Extensions']
    },

    DrawUI: {
        src: [
            'draw/draw/DrawToolbar.js'
        ],
        desc: 'Draw toolbar.',
        deps: ['DrawHandlers', 'CommonUI']
    },

    EditUI: {
        src: [
            'draw/edit/EditToolbar.js',
            'draw/edit/handler/EditToolbar.Edit.js',
            'draw/edit/handler/EditToolbar.Delete.js'
        ],
        desc: 'Edit toolbar.',
        deps: ['EditHandlers', 'CommonUI']
    },

    LabelCore: {
        src: [
            'label/Leaflet.label.js'
        ],
        desc: 'The core of the plugin. Currently only includes the version.',
        heading: '标注'
    },

    Label: {
        src: [
            'label/Label.js',
            'label/BaseMarkerMethods.js',
            'label/Marker.Label.js',
            'label/CircleMarker.Label.js',
            'label/Path.Label.js',
            'label/Map.Label.js',
            'label/FeatureGroup.Label.js'
        ],
        desc: 'Leaflet.label plugin files.',
        deps: ['LabelCore']
    },

    SupermapTask: {
        src: [
            'task/supermap/SupermapQuery.js',
            'task/supermap/SupermapTansaction.js'
        ],
        desc: '提供超图的查询，以及数据更新',
        deps: ['Request']
    },

    WFSTask: {
        src: [
            'task/WFS/GMLUtil.js',
            'task/WFS/GML/Marker.js',
            //'task/WFS/GML/MultiPolygon.js',
            //'task/WFS/GML/MultiPolyline.js',   新版本中没有这两个类了
            'task/WFS/GML/Polyline.js',
            'task/WFS/GML/Polygon.js',
            'task/WFS/XmlUtil.js',
            'task/WFS/Format.js',
            'task/WFS/Format.GeoJSON.js',
            'task/WFS/Filter.js',
            'task/WFS/Filter.GmlObjectID.js',
            'task/WFS/Filter.Property.js',
            'task/WFS/Filter.Spatial.js',
            'task/WFS/Filter.BBox.js',
            'task/WFS/Where.js',
            'task/WFS/WFSQuery.js',
            'task/WFS/WFS.Transaction.js',
            'task/WFS/WFS.Transaction.Helpers.js',
            'task/WFS/WFS.Transaction.Requests.js'
        ],
        desc: 'WFS查询以及编辑的功能',
        deps: ['Request']
    },
    GGCJ02: {
        src: ['geo/projection/Projection.GCJ02.js',
            'geo/crs/CRS.GCJ02.js',
            'geo/projection/Projection.BD09.js'],
        desc: 'EPSG:GCJ02 projection (used by some map providers).',
        deps: ['Proj'],
        heading: '腾讯，高德坐标系'
    },
    SingleCRS: {
        src: ['geo/crs/UNKNOWN.js'],
        desc: '自定义坐标',
        deps: ['Proj'],
        heading: '独立坐标'
    },
    EsriTask: {
        src: [
            'task/esri/base/EsriLeaflet.js',
            'task/esri/base/Util.js',
            'task/esri/base/Request.js',
            'task/esri/Service.js',
            'task/esri/Task.js',
            'task/esri/EsriQuery.js',
            'task/esri/EsriTransation.js'
        ],
        desc: 'Esri的查询编辑功能',
        heading: 'Esri'
    },
    Animate: {
        src: [
            'animate/AnimatedMarker.js'
        ],
        deps: ['EditHandlers'],
        desc: '轨迹',
        heading: '轨迹'
    },
  /*  Locate: {
        src: [
            'locate/L.Control.Locate.js'
        ],
        desc: '手机定位',
        heading: '手机定位'
    },*/
    Search: {
        src: [
            'search/l.control.geosearch.js',
            'search/l.geosearch.provider.bing.js'
        ],
        desc: '查询',
        heading: '查询'
    },
    WKT:{
        src:[
            'wkt/wicket.js',
            'wkt/wicket-leaflet.js'
        ],
        desc:'WKT',
        heading:'WKT'
    }
};

if (typeof exports !== 'undefined') {
    exports.deps = deps;
}

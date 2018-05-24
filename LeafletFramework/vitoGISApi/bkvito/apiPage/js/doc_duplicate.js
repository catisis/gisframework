/**
 * Created by Administrator on 2016/9/12.
 */


$(document).ready(function(e) {
    $(function() {
        //实现当滚动条滚动的高度大于左侧菜单栏的偏移高度时，左侧菜单栏位置相对屏幕固定
        var elm = $('#t');
        var startPos = $(elm).offset().top;
        $.event.add(window, "scroll", function() {
            var p = $(window).scrollTop();
            $(elm).css('position',((p) > startPos) ? 'fixed' : 'static');
            $(elm).css('top',((p) > startPos) ? '0' : '');
            $(elm).css('width',((p) > startPos) ? '22%':'');
        });
    });
});

var aim = ['demo','initF','listenerF','event','getMapStatusF','setMapStatusF','getFeatureStatusF','setFeatureStatusF','offAutoQuery','drawPointLinePolygon','setFeature','deletfeature','modifyfeature','measuredis','measurepolygon','streetview','track','conf','getconf','modifyconf','baselayer','featurelayer'];
$.ajax({
    type: 'get',
    url: 'dom/apiDoc.md',
    dataType: 'text',
    success: function(data) {
        var converter = new showdown.Converter({
            tables:true
        });
        html = converter.makeHtml(data);

        var htmlArray = html.split('<hr />');

        $('#menu').html(htmlArray[0]);
        $('#overiframe').html(htmlArray[1]);
        var $a = $('#menu a');
        for(var i = 0; i < $a.length; i++ ) {
            $a[i].href = "#" + aim[i];
            $('#overiframe h5')[i].id = aim[i];
        }
        $a.on('click', function () {
            var $this = $(this);
            debugger;
            $this.addClass("clickState");
            $this.parents().siblings().find("a").removeClass("clickState");
        });
        $("#menu>ul:eq(0)>li:eq(0)>a").attr("class","clickState");
    },
    error: function() {

    }
});


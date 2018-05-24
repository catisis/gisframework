/**
 * Created by bk on 2016/8/26.
 */
var codeUrl = "",dataJsonUrl = "";
function clickEventForA() {
    //当前显示的第一个，赋初始值。只针对了一级。
    var $a = $("#menu > ul > li:first-child > a");
    $a.addClass("clickState");
    codeUrl = $a.attr("data-url");
    dataJsonUrl = $a.attr("data-json");
    $('a').on('click', function (e) {
        var $this = $(this);
        $this.addClass("clickState");
        $this.parent().siblings().find("a").removeClass("clickState");
        $(".submenu").css("display","none");
        $this.parent().siblings().children("a").children("i").removeClass("t_open");
        //console.log($this.attr("data-url"));如果没有data-url则是undefined
        var dataUrl = $this.attr("data-url");
        if(dataUrl) {
            $("#overiframe")[0].src = dataUrl;
            $this.parents(".submenu").css("display","block");
            codeUrl = dataUrl;
            dataJsonUrl = $this.attr("data-json");
        } else {
            var className = $this.children("i").attr("class");
            if(className.indexOf("t_open") > - 1){
                $this.children("i").removeClass("t_open");
                $this.next().css("display","none");
            } else {
                $this.children("i").addClass("t_open");
                $this.next().css("display","block");
            }
        }
    });
}




$("#btn_show").click(function(){
    $("#overiframe")[0].src = "tab_change.html?codeUrl=" + codeUrl + "&jsonUrl=" + dataJsonUrl;
});
$("#btn_hide").click(function(){
    $("#overiframe")[0].src = codeUrl;
});

$(document).ready(function(){
    $(".qiehuan").click(function(){
        $("#qr_box").css("display","block");
    });
    $("#chahao").click(function(){
        $("#qr_box").css("display","none");
    });
});
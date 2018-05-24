/**
 * Created by bk on 2016/8/29.
 */
var $ul = $("#menu > ul");

//获取json文件的内容
$.getJSON("menu.json",function(data){
    for(var k in data) {
        if(data[k]["url"]) {
            var $li = $("<li>").attr("id",k).appendTo($ul);
            var $a = $("<a>").attr("class","one_head").attr("data-url", data[k].url).attr("data-json",data[k].jsonUrl).html(data[k].name).appendTo($li);
        } else {
            var $liP = $("<li>").attr("id",k).appendTo($ul);
            var $aP = $("<a>").attr("class","one_head").html(data[k].name).appendTo($liP);
            var $i = $("<i>").attr("class","t_close").appendTo($aP);
            var $div = $("<div>").attr("class","submenu").appendTo($liP);
            var $dl = $("<dl>").appendTo($div);
            for(var n in data[k]["submenu"]) {
                var $dd = $("<dd>").appendTo($dl);
                $("<a>").attr("data-url", data[k]["submenu"][n].url).attr("data-json",data[k]["submenu"][n].jsonUrl).html(data[k]["submenu"][n].name).appendTo($dd);
            }
        }
    }
    clickEventForA();
});
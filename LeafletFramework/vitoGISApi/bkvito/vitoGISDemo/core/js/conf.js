/**
 * Created by bk on 2016/8/29.
 */
var tabs=document.getElementById("tab").getElementsByTagName("li");
for(var i=0;i<tabs.length;i++){
    tabs[i].onclick=function(){change(this);}
}
function change(obj){
    $("#" + obj.getAttribute("value")).siblings().css("display","none");
    document.getElementById(obj.getAttribute("value")).style.display = "block";
    $(obj).siblings().removeClass("t1");
    $(obj).addClass("t1");
}

var url = window.location.search;
var Request = {};
if (url.indexOf("?") != -1) {
    var str = url.substr(1);
    strs = str.split("&");
    for (var j = 0; j < strs.length; j++) {
        Request[strs[j].split("=")[0]] = decodeURI(strs[j].split("=")[1]);
    }
}
getCodeAndJson(Request.codeUrl,Request.jsonUrl);

//$("#overiframe1")[0].src = Request.codeUrl;

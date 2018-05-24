/**
 * Created by bk on 2016/10/13.
 */
/*
 功能：保存cookies函数
 参数：name，cookie名字；value，值
 */
function SetCookie(name,value){
    //var Days = 12*30*24*60*60;   //cookie 将被保存一年
    var exp  = new Date();  //获得当前时间
    exp.setTime(exp.getTime() + 3*24*60*60*1000);  //换成毫秒
    document.cookie = name + "="+ value + ";expires=" + exp.toGMTString();
}
/*
 功能：获取cookies函数
 参数：name，cookie名字
 */
function getCookie(name){
    var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
    if(arr != null){
        return arr[2];
    }else{
        return null;
    }
}

/*
 功能：删除cookies函数
 参数：name，cookie名字
 */

function delCookie(name){
    var exp = new Date();  //当前时间
    exp.setTime(exp.getTime() - 1);
    var cval=getCookie(name);
    if(cval!=null) document.cookie= name + "="+cval+";expires="+exp.toGMTString();
}
/**
 * Created by bk on 2016/8/30.
 */

function getCodeAndJson(codeUrl,jsonUrl){
    parent.$.ajax({
        url : codeUrl,
        success : function(result){
            var editor = CodeMirror(document.getElementById("code"), {
                mode: "text/html",
                extraKeys: {"Ctrl-Space": "autocomplete"},
                value: result
            });
            editor.setOption("theme", "default");
            editor.display.wrapper.className += " CodeMirror-wrap";
        }
    });

    parent.$.ajax({
        url : jsonUrl,
        success : function(result){
            var editor1 = CodeMirror(document.getElementById("jn"), {
                mode: {name: "javascript", json: true},
                extraKeys: {"Ctrl-Space": "autocomplete"},
                value: result
            });
            editor1.setOption("theme", "eclipse");
            document.getElementById("jn").style.display = "none";
        }
    });

}

function getFormatJsonStrFromString(jsonStr){
    var res="";
    for(var i=0,j=0,k=0,ii,ele;i<jsonStr.length;i++)
    {//k:缩进，j:""个数
        ele=jsonStr.charAt(i);
        if(j%2==0&&ele=="}")
        {
            k--;
            for(ii=0;ii<k;ii++) ele="  "+ele;
            ele="\n"+ele;
        }
        else if(j%2==0&&ele=="{")
        {
            ele+="\n";
            k++;
            for(ii=0;ii<k;ii++) ele+="  ";
        }
        else if(j%2==0&&ele=="[")
        {
            ele+="\n";
            k++;
            for(ii=0;ii<k;ii++) ele+="  ";
        }
        else if(j%2==0&&ele=="]")
        {
            k--;
            for(ii=0;ii<k;ii++) ele="  "+ele;
            ele="\n"+ele;
        }
        else if(j%2==0&&ele==",")
        {
            ele+="\n";
            for(ii=0;ii<k;ii++) ele+="  ";
        }
        else if(ele=="\"") j++;
        res+=ele;
    }
    return res;
}
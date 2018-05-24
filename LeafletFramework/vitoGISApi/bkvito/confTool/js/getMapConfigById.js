/**
 * Created by bk on 2016/6/25.
 */
function reLoadConfFiles(Id){
	$.ajax({
        type: "post",
         url: ctx + "/sys/vitoconfig/getMapConfigById.ht?",
         data: {id: Id},
         dataType: "json",
         success: function(data) {
        	 updateID = data.rows[0].id;
        	 maptitle = data.rows[0].maptitle;
        	 var mapConfig = $.parseJSON(data.rows[0].mapinit);
        	 delete mapConfig.divConfig;
        	 var project = ""; //项目名
        	 var baseLayerIP = "",featureLayerIP = ""; // 底图和图层的IP地址
        	 for(var k in mapConfig.featureLayersConf){
        		 project = mapConfig.featureLayersConf[k].nameSpace; //取namespace，用来确定是那个项目。
        		 url = mapConfig.featureLayersConf[k].url;
        		 var urlArray = url.match(getIP);
        		 featureLayerIP = urlArray[0];
        		 break;
        	 }
        	 for(var k in mapConfig.baseLayerConf){
        		 mapUrl = mapConfig.baseLayerConf[k].mapUrl;
        		 var mapUrlArray = mapUrl.match(getIP);
        		 if(mapUrlArray){
        			 baseLayerIP = mapUrlArray[0];
            		 break;
        		 }
        	 }
        	 
        	 
              //设置select 选中项
    		  var count = $("#select_area option").length;
    		  
    		  for(var i=0;i<count;i++) {
    			  if($("#select_area").get(0).options[i].value == project){ 
    		          $("#select_area").get(0).selectedIndex = i;  
    		          break;  
    		      }  
    		  }
        	 // 将project的底图显示出来
    		 $("#baseLayerConf-" + project).removeClass("hidden").siblings("div").addClass("hidden");
         	 showBaseLayerConfTitle(project);
         	 //所有checkbox都是不选中的状态
         	 $(":checkbox").removeAttr("checked");
         	 
        	 var valueArray = []; //存放选中checkbox的value
        	 for(var l in mapConfig) {
        		 if(l === "baseLayerConf") {
        			 $("#input-" + l)[0].value = baseLayerIP;
        			 for(var m in mapConfig[l]) {
        				 var tempStr = l + "-" + project + "-" + m;
        				 valueArray.push(tempStr);
        			 } 
        		 } else {
        			 var num = 0;
        			 $("#input-" + l)[0].value = featureLayerIP;
        			 for(var n in mapConfig[l]){
        				 var tempStr = l + "-" + n;
        				 valueArray.push(tempStr);
        				 num++;
        			 }
        			 //全选checkbox被选中
        			 var inputCount = $("#" + l + "All").next().children("span").length;
        			 if(inputCount == num) {
        				 $("#" + l + "All"+ " > input").prop("checked", true);
        			 }
        		 }
        	 }

        	 
        	 for(var j=0; j < valueArray.length; j++) {
        		 var $inputCheckbox = $("input[value='" + valueArray[j] + "']");
            	 $inputCheckbox.prop("checked", true);
        	 }
         },
         error: function() {
        	 console.log("reLoadConfFiles获取数据失败!");
         }
     });
}

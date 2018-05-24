/**
 * Created by bk on 2016/6/8.
 */
//使页面上显示底图，图层，插件三大块。
function showConfTitle() {
    //处理confType，使confType包括中文的名字
    var titleArray = confType.title;
    for (var i = 0; i < titleArray.length; i++) {
        if (titleArray[i] === "baseLayerConf") {
            confType.list.push([titleArray[i], "底图配置", "底图"]);
        } else if (titleArray[i] === "featureLayersConf") {
            confType.list.push([titleArray[i], "图层配置", "图层"]);
        } else {
            confType.list.push([titleArray[i], "插件配置", "插件"]);
        }
    }


//将id为artContainer模板添加到页面中
    var html = template('artContainer', confType);
    document.getElementById('container').innerHTML = html;

    $("#inputText-baseLayerConf").removeClass("hidden");
    $("#inputText-featureLayersConf").removeClass("hidden");

    addBaseLayerSelect();
    setContentforFW();
    $("input[value='widgetsConfig-Tools_gy']").removeAttr("checked");
    $("input[value='widgetsConfig-AreaAnalysis_gy']").removeAttr("checked");
    
}


//为底图添加地区的下拉列表
function addBaseLayerSelect() {
    var Areasource =  '<label class="control-label">项目:</label><select class="col-xs-8 col-sm-4 col-md-2" id="select_area">'
        +  '{{each areaNameList as value i}}'
        +  '<option value="{{value[0]}}">{{value[1]}}</option>'
        +  '{{/each}}'
        +  '</select>';


    var baseLayerSource =  '{{each areaList as value i}}'
        +  '<div id="baseLayerConf-{{value}}" style="clear: both;overflow: hidden;" class="hidden">'
        +  '</div>'//这个div用来放底图
        +  '{{/each}}';
    var renderArea = template.compile(Areasource);
    var AreaName = [];
    for(var i = 0,temp =Area.baseLayerConf; i < temp.length; i++) {

        AreaName.push([temp[i],AreaChinese[temp[i]]]);
    }
    var areahtml = renderArea({areaNameList: AreaName});
    var renderbaseLayer = template.compile(baseLayerSource);
    var baseLayerhtml = renderbaseLayer({areaList: Area.baseLayerConf});
    document.getElementById("baseLayerConf").innerHTML = areahtml + baseLayerhtml;

    var selectValue = $('#select_area').val();
    $( "#baseLayerConf-" + selectValue).removeClass("hidden").siblings("div").addClass("hidden");
    showBaseLayerConfTitle(selectValue);
    $('#input-baseLayerConf')[0].value = defaultIP[selectValue].mapIP || "";
    $('#input-featureLayersConf')[0].value = defaultIP[selectValue].featureIP || "";
    

    $('#select_area').on('change', function () {
        var selectValue = $('#select_area').val();
        var $inputText = $(":text");
        //$inputText.remove("disabled");
        $inputText.prop("disabled", false);
        for(var i = 0; i < netMap.length; i++) {
            if(netMap[i] == selectValue) {
                $inputText.prop("disabled", true);
                break;
            }
        }
        showBaseLayerConfTitle(selectValue);
        $( "#baseLayerConf-" + selectValue).removeClass("hidden").siblings("div").addClass("hidden").html("");
        $('#input-baseLayerConf')[0].value = defaultIP[selectValue].mapIP || "";
        $('#input-featureLayersConf')[0].value = defaultIP[selectValue].featureIP || "";
    });

}
//给<div id="baseLayerConf-{{areaList[0]}}" style="clear: both;">添加内容
function showBaseLayerConfTitle(selectArea) {

    var tempConfName = [];
    var baseLayerTitle = confName.baseLayerConf;
    for(var count = 0; count < baseLayerTitle.length; count++) {
        if(baseLayerTitle[count][1].indexOf(selectArea + "-") > -1) {
            tempConfName.push(baseLayerTitle[count]);
        }
    }

    var baseLayersource = '<div style="margin-left: 20px">'
        +    '{{each list as value i}}'
        +        '<span class="col-xs-12 col-sm-6 col-md-3">'
        +           '<input type="checkbox" value="{{title}}-{{list[i][1]}}" checked> {{list[i][0]}}'//value这样设置为了最后取数据方便
            //+           '<img src="imgs/{{list[i][1]}}.jpg"  alt=""/>'
        +        '</span>'
        +    '{{/each}}'
        + '</div>';

    var renderTrs = template.compile(baseLayersource);
    
    var totalhtmlTrs = renderTrs({list: tempConfName,title: "baseLayerConf"});

    document.getElementById("baseLayerConf-" + selectArea).innerHTML =   totalhtmlTrs;
}



//给图层和插件的div插入内容

function setContentforFW() {
    for(var l in confName) {
        if(l !== "baseLayerConf") {
            var source = '<div>'
                +    '{{each list as value i}}'
                +        '<span class="col-xs-12 col-sm-6 col-md-3" title="{{list[i][2]}}" style="margin-top:5px;"><input type="checkbox" name="{{list[i][3]}}" value="{{title}}-{{list[i][1]}}" checked> {{list[i][0]}}</span>' //value这样设置为了最后取数据方便
                +    '{{/each}}'
                + '</div>';

            var render = template.compile(source);
            var tempConfName = confName[l];
            for(var i = 0; i < tempConfName.length; i++) {
                tempConfName[i].push(description[tempConfName[i][1]]);
                tempConfName[i].push(widgetsID[tempConfName[i][1]]);
            }
            var totalhtml = render({list: tempConfName,title: l});

            if(l == "featureLayersConf") {
                var $inputCheck = $('<div> <input type="checkbox" value="all" checked/> 全选</div>');
                $inputCheck.attr("id",l + "All");
                var checkAllHtml = $inputCheck[0].outerHTML;
            } else {
                $inputCheck = $('<div> <input type="checkbox" value="all" /> 全选 </div>');
                $inputCheck.attr("id",l + "All");
                checkAllHtml = $inputCheck[0].outerHTML;
            }

            document.getElementById(l).innerHTML = checkAllHtml + totalhtml;

            $("#" + l).css("padding-left","20px");
            $("#" + l + "> div ").css("margin-top","10px").css("overflow","hidden");
            $("#" + l + "> div > input + input").css("margin-left","30px");

            $("#" + l + "All" + " > input").on("click", function (e) {
                var $this = $(this);
                if(this.checked) {
                    $this.parent().next("div").find("input").prop("checked", true);
                } else {
                    $this.parent().next("div").find("input").removeAttr("checked");
                }
            });

            $("#" + l  + " > div:eq(1)  :checkbox").on("click", function (e) {
                var $this = $(this);

                if(this.name) {
                	if(this.checked) {
                		$("input[name='" + this.name + "']").removeAttr("checked");
                		$this.prop("checked", true);
                	}
                }
                if(!this.checked) {
                    //$("#" + l + "All" + " > input").removeAttr("checked");
                    $this.parent().parent().prev().find("input").removeAttr("checked");
                } else {
                    var checkboxCount = $this.parent().siblings().length;
                    var checkedCount = $this.parent().siblings().find("input[type='checkbox']:checked").length;
                    if(checkboxCount === checkedCount) {
                        $this.parent().parent().prev().find("input").prop("checked", true);
                    }
                }
            });
        }
    }
}

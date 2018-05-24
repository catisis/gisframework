/**
 * Created by bk on 2016/10/13.
 */
function getCookies() {
    //取input的cookie值
    var txtIPString = getCookie("txtIP");
    if(txtIPString !== null) {
        var txtIP = JSON.parse(txtIPString);
        $("#input-baseLayerConf")[0].value = txtIP.txtBaseLayerIP;
        $("#input-featureLayersConf")[0].value = txtIP.txtFeatureLayersIP;
    }
    //取项目的cookie值
    var selectArea = $("#select_area").get(0);
    var projectNumber = getCookie("projectNum");
    if(projectNumber !== null) {
        selectArea.selectedIndex = projectNumber;
        var projectName = selectArea.options[projectNumber].value;
        $("#baseLayerConf-" + projectName).removeClass("hidden").siblings("div").addClass("hidden").html("");
        showBaseLayerConfTitle(projectName);
    }

    //取baseLayers的cookie值
    var baseLayerNum = getCookie("baseLayerNum");
    if(baseLayerNum !== null) {
        var $baseLayerChecked  = $("input[value*='baseLayerConf-']");
        $baseLayerChecked.removeAttr("checked");

        $($baseLayerChecked).each(function (index, ele) {
            var $ele = $(ele);
            if(baseLayerNum[index] == "1") {
                $ele.prop("checked", true);
            }
        });

    }
    //取featureLayers的cookie值
    var featureLayerNum = getCookie("featureLayerNum");
    if(featureLayerNum !== null) {
        var $featureLayerChecked  = $("input[value*='featureLayersConf-']");
        $featureLayerChecked.removeAttr("checked");

        $($featureLayerChecked).each(function (index, ele) {
            var $ele = $(ele);
            if(featureLayerNum[index] == "1") {
                $ele.prop("checked", true);
            }
        });

    }
    //取widgets的cookie值
    var widgetsNum = getCookie("widgetsNum");
    if(widgetsNum !== null) {
        var $widgetsChecked  = $("input[value*='widgetsConfig-']");
        $widgetsChecked.removeAttr("checked");

        $($widgetsChecked).each(function (index, ele) {
            var $ele = $(ele);
            if(widgetsNum[index] == "1") {
                $ele.prop("checked", true);
            }
        });

    }
}
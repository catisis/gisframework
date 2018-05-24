/**
 *
 */

function showConfTitle(){
    //处理confType，使confType包括中文的名字
    var titleArray = confType.title;
    for(var i = 0; i < titleArray.length; i++) {
        if(titleArray[i] === "baseLayerConf") {
            confType.list.push([titleArray[i],"底图配置","底图"]);
        } else if(titleArray[i] === "featureLayersConf") {
            confType.list.push([titleArray[i],"图层配置","图层"]);
        } else {
            confType.list.push([titleArray[i],"插件配置","插件"]);
        }
    }


//将id为artContainer模板添加到页面中
    var html = template('artContainer', confType);
    document.getElementById('container').innerHTML = html;

    $("#inputText-baseLayerConf").removeClass("hidden");
    $("#inputText-featureLayersConf").removeClass("hidden");



    for(var a in Area) {
        if(a !== "divConfig") {
            var Areasource =  '<div>'
                + '{{each areaList as value i}}'
                +     '<div id="{{title}}-{{value}}" style="clear: both;"></div>'
                + '{{/each}}'
                + '</div>';

            var renderArea = template.compile(Areasource);
            var areahtml = renderArea({areaList: Area[a],title:a});
            document.getElementById(a).innerHTML = areahtml;
        }
    }

//将checkbox添加到页面中
    for(var l in confName) {

        var confNameArray = confName[l][0][1].split("-");
        var confNameLength = confNameArray.length;
        if(confNameLength > 1) {

            for(var tr = 0; tr < Area[l].length; tr++) {

                var source = '<div style="margin-left: 20px">'
                    +    '<h4>{{areaName}}</h4>'
                    +    '{{each list as value i}}'
                    +        '<span class="col-xs-12 col-sm-4 col-md-2">'
                    +           '<input type="checkbox" value="{{title}}-{{list[i][1]}}" > {{list[i][0]}}'//value这样设置为了最后取数据方便
                        //+           '<img src="imgs/{{list[i][1]}}.jpg"  alt=""/>'
                    +        '</span>'
                    +    '{{/each}}'
                    + '</div>';

                var renderTrs = template.compile(source);

                var tempConfName = [];
                for(var count = 0; count < confName[l].length; count++) {
                    if(confName[l][count][1].indexOf(Area[l][tr] + "-") > -1) {
                        tempConfName.push(confName[l][count]);
                    }
                }

                //console.log(AreaChinese[Area[l][tr]]);

                var totalhtmlTrs = renderTrs({list: tempConfName,title: l,areaName:AreaChinese[Area[l][tr]]});

                document.getElementById(l + "-" + Area[l][tr]).innerHTML =   totalhtmlTrs;

                if(tr === 0) {
                    $('#' + l + '-' + Area[l][tr] + ' input').prop("checked", true);
                }

                $('#' + l + '-' + Area[l][tr] + ' input').on('click', function () {
                    var parentIdArray = this.value.split('-');

                    $('#' + parentIdArray[0] + "-" + parentIdArray[1]).siblings().find("input").removeAttr("checked");
                });

                $('#' + l + '-' + Area[l][tr] + ' h4').on('click', function (e) {
                    var $this = $(this);

                    $this.siblings().find("input[type='checkbox']").prop("checked",true);
                    $this.parent().parent().siblings().find("input").removeAttr("checked");
                });
            }

        } else {
            var source = '<div>'
                +    '{{each list as value i}}'
                +        '<span class="col-xs-12 col-sm-4 col-md-2"><input type="checkbox" value="{{title}}-{{list[i][1]}}" checked> {{list[i][0]}}</span>' //value这样设置为了最后取数据方便
                +    '{{/each}}'
                + '</div>';

            var render = template.compile(source);
            var totalhtml = render({list: confName[l],title: l});


            if(l == "featureLayersConf") {
                var $inputCheck = $('<div> <input type="checkbox" value="all" checked/> 全选</div>');
                $inputCheck.attr("id",l + "All");
                var checkAllHtml = $inputCheck[0].outerHTML;
            } else {
                $inputCheck = $('<div> <input type="checkbox" value="all" checked/> 全选 </div>');
                $inputCheck.attr("id",l + "All");
                checkAllHtml = $inputCheck[0].outerHTML;
            }


            document.getElementById(l).innerHTML = checkAllHtml + totalhtml;


            $("#" + l).css("padding-left","20px");
            $("#" + l + "> div ").css("margin-top","10px");
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


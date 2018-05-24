exports.processRequest = function (request, response) {
    var url = require('url');
    var qs = require('querystring');
    var fs = require('fs');
    var crypto = require('crypto');
    var archiver = require('archiver');

    /**
     * 照样输出json格式的数据
     * @param query
     * @param res
     */
    var writeOut = function (query, res) {
        res.write(JSON.stringify(query));
        res.end();
    };
    response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
    if (request.method.toUpperCase() == 'POST') {
        var postData = "";
        /**
         * 因为post方式的数据不太一样可能很庞大复杂，
         * 所以要添加监听来获取传递的数据
         * 也可写作 request.on("data",function(data){});
         */
        request.addListener("data", function (data) {
            postData += data;
        });
        /**
         * 这个是如果数据读取完毕就会执行的监听方法
         */
        request.addListener("end", function () {
            var query = qs.parse(postData);
            var mapConfig = JSON.parse(query.mapconfig);
            var widgetsFiles = [];
            for(var k in mapConfig.widgetsConfig) {
                widgetsFiles.push('widgets/' + k + '/**');
            }
            //配置的插件
            var curDate = new Date();
            var disPath = curDate.toLocaleString();
            var md5 = crypto.createHash('md5');//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
            md5.update(disPath);
            var md5Hex = md5.digest('hex');
            var dir = 'vitoGISApi/download/' + md5Hex + '/'  + 'conf.json';  //加密后的值dir
            var dHtml = 'vitoGISApi/download/' + md5Hex + '/' + 'index.html';
            console.log("加密的结果："+ md5Hex);
            if (!fs.existsSync('vitoGISApi/download/' + md5Hex)) {
                fs.mkdirSync('vitoGISApi/download/' + md5Hex);
            }
            var htmlStr = fs.readFileSync('vitoGISApi/download/templet.html','utf8');
            var re = new RegExp ('#confStr#','g');
            if(mapConfig.featureLayersConf || mapConfig.widgetsConfig){
                htmlStr = htmlStr.replace(re,'conf.json');
            } else {
                delete  mapConfig.divConfig;
                htmlStr = htmlStr.replace(re,JSON.stringify(mapConfig));
            }
            fs.writeFileSync(dHtml,htmlStr,'utf8');
            fs.writeFile(dir, query.mapconfig,'utf8', function(err)  {
                if (err) {
                    throw err;
                } else {
                    var zipName = 'vitoGISApi/download/' + md5Hex + '.zip';
                    var output = fs.createWriteStream(zipName);
                    var archive = archiver('zip');

                    archive.on('error', function(err){
                        throw err;
                    });

                    archive.pipe(output);
                    archive.bulk([
                        {
                            expand: true,
                            cwd : 'vitoGISApi/download/' + md5Hex,
                            src: ['conf.json','index.html']
                        },
                        {
                            expand: true,
                            cwd : 'vitoGISApi/download/',
                            src: ['gis/**','Readme.md']
                        },
                        {
                            expand: true,
                            cwd : 'dist/',
                            src: widgetsFiles
                        }
                    ]);
                    archive.finalize();
                    archive.on('end', function () {
                        var downloadUrl = '/vitoGISApi/download/' + md5Hex + '.zip';
                        var fileName = {name:dir,downloadUrl: downloadUrl};
                        writeOut(fileName, response);
                    });
                }
            });
        });
    }
};

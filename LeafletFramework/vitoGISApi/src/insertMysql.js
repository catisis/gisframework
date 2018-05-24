/**
 * Created by bk on 2017/2/28.
 */

function insert(mysql,data){
    var DATABASE = 'mapConf';
    var TABLE = 'conf';
//创建连接
    var client = mysql.createConnection({
        host     : '127.0.0.1',
        user     : 'root',
        password : '123456',
        port: '3306',
        database: 'mapConf'
    });
    client.connect();
    client.query("use " + DATABASE);
    var curDate = new Date().toLocaleString();
    var dataStr = JSON.stringify(data.mapconfig);
    var insertSQL = "insert into conf values( NULL,'" + curDate + "'," + dataStr + ")";
    console.log(insertSQL);
    client.query(
        insertSQL,
        function selectCb(err, res) {
            if (err) {
                throw err;
            }
            console.log("INSERT Return ==> ");
            console.log(res);
            client.end();
        }
    );
}

exports.processRequest = function (request, response) {
    var qs = require('querystring');
    var mysql = require('mysql');


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
            insert(mysql,query);
            response.write(JSON.stringify(query));
            response.end();
        });
    }
};
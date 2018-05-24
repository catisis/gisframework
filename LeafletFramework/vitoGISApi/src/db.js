/**
 * Created by bk on 2017/2/27.
 */
var mongoose = require('mongoose'),
    DB_URL = 'mongodb://192.168.0.80:27017/Message';

/**
 * 连接
 */
mongoose.Promise = global.Promise;//解决：自带的promise过时的错误
mongoose.connect(DB_URL);

/**
 * 连接成功
 */
mongoose.connection.on('connected', function () {
    console.log('Mongoose connection open to ' + DB_URL);
});

/**
 * 连接异常
 */
mongoose.connection.on('error',function (err) {
    console.log('Mongoose connection error: ' + err);
});

/**
 * 连接断开
 */
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose connection disconnected');
});

module.exports = mongoose;
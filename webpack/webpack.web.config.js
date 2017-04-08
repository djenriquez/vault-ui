var webpack = require('webpack');
var config = require('./webpack.min.config');

config.target = "web";
config.plugins.push(new webpack.DefinePlugin({WEBPACK_DEF_TARGET_WEB: true}));

module.exports = config;

var webpack = require('webpack');
var config = require('./webpack.min.config');

config.target = "electron";
config.plugins.push(new webpack.DefinePlugin({WEBPACK_DEF_TARGET_WEB: false}));

module.exports = config;

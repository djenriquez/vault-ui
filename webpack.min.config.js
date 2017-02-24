var config = require('./webpack.config');
var webpack = require('webpack');

var reactprodmode = new webpack.DefinePlugin({
    'process.env': {
        'NODE_ENV': JSON.stringify('production'),
        'AXIOS_TIME_OUT': process.env.AXIOS_TIME_OUT
    }
});
config.plugins.push(reactprodmode);

var uglify = new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    comments: false,
    sourceMap: false,
    compress: {
        warnings: false,
    }
});
config.plugins.push(uglify);

delete config.devtool;

module.exports = config;

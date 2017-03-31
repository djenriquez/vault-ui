var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var autoprefixer = require('autoprefixer');

module.exports = {
    entry: {
        common: './app/App.jsx'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    target: 'web',
    output: {
        path: './dist',
        publicPath: '/assets/',
        filename: 'bundle.js'
    },
    devtool: 'eval',
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel?cacheDirectory'],
            exclude: 'node_modules'
        }, {
            test: /\.json$/i,
            loader: 'json-loader',
            exclude: 'node_modules'
        }, {
            test: /\.svg$/,
            loader: 'url'
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('css?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'),
            exclude: /node_modules/
        }, {
          test: /\.ico$/,
          loader: 'file-loader?name=[name].[ext]'  // <-- retain original file name
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('css!postcss-loader'),
            include: /node_modules/
        }]
    },
    postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
    plugins: [
        new ExtractTextPlugin("styles.css"),
        new webpack.IgnorePlugin(/regenerator|nodent|js-beautify/, /ajv/)
    ]
};

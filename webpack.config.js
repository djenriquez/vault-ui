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
    output: {
        path: './dist',
        publicPath: '/assets/',
        filename: 'bundle.js'
    },
//    devtool: 'source-map',
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
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('css!postcss-loader'),
            include: /node_modules/
        }]
    },
    postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
    plugins: [
        // new webpack.DefinePlugin({
        //     'process.env': {
        //        'NODE_ENV': JSON.stringify('production')
        //     }
        //   }),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false,
        //         screw_ie8: true
        //     },
        //     comments: false,
        //     sourceMap: false
        // }),
        new ExtractTextPlugin("styles.css"),
        new webpack.IgnorePlugin(/regenerator|nodent|js-beautify/, /ajv/)
    ]
};

var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');

module.exports = function (env) {
    let buildfor = (env && env.target) ? env.target : "web";
    let sourcemap = (env && env.sourcemap) ? "eval" : false;

    return {
        target: buildfor,
        entry: {
            common: './app/App.jsx'
        },
        resolve: {
            modules: [
                "node_modules"
            ],
            extensions: ['.js', '.jsx']
        },
        devtool: sourcemap,
        output: {
            path: path.resolve(__dirname, './dist'),
            publicPath: 'dist/',
            filename: buildfor + '-bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    use: ['babel-loader?cacheDirectory=true']
                },
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: ['css-loader?modules=true&localIdentName=[path][name]__[local]--[hash:base64:5]', 'postcss-loader']
                    }),
                    include: path.resolve(__dirname, './app')
                },
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: ['css-loader', 'postcss-loader']
                    }),
                    include: path.resolve(__dirname, './node_modules')
                },
                {
                    test: /\.ico$/,
                    use: ['file-loader?name=[name].[ext]']
                },
                {
                    test: /\.(svg|png)$/,
                    use: ['url-loader']
                }
            ]
        },
        plugins: [
            new ExtractTextPlugin("styles.css"),
            new webpack.IgnorePlugin(/regenerator|nodent|js-beautify/, /ajv/),
            new webpack.DefinePlugin({WEBPACK_DEF_TARGET_WEB: (buildfor == "web")})
        ]
    }
};
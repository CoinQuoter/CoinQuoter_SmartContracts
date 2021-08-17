const path = require('path');
const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
    entry: {
        rt_maker: './src/rt_maker.ts',
        rt_client: './src/rt_client.ts'
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            process: "process/browser"
        },
    },
    output: {
        filename: `[name].js`,
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify"),
            "https": require.resolve("https-browserify"),
            "http": require.resolve("stream-http"),
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("readable-stream")
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        })
        , new NodePolyfillPlugin()
    ]
};

const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const prod = process.argv.includes('prod');

module.exports = {
    mode: prod? "production": "development",
    entry: path.join(__dirname, "public", "index.ts"),
    devtool: prod?  undefined: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/,
                    /src/
                ]
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: { 
        filename: 'index.js',
        path: path.join(__dirname, "build", "public"),
    },
    optimization: {
        minimize: prod,
        minimizer: [
            new TerserPlugin()
        ]
    },
    plugins:[
        new CopyWebpackPlugin({
            patterns: [
                {
                    to: path.join(__dirname, "build", "public", "index.html"),
                    from: path.join(__dirname, "public", "index.html")
                }
            ]
        })
    ]
}
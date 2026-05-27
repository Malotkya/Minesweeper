const path = require("path");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const {version} = require("./package.json")

const SRC_DIR = path.join(__dirname, "app");
const BUILD_DIR = path.join(__dirname, "build");
const PROD = process.argv.includes('prod');

module.exports = {
    mode: PROD? "production": "development",
    devtool: PROD? undefined: 'source-map',
    target: "web",
    entry: [
        path.join(SRC_DIR, 'index.ts'),
        path.join(SRC_DIR, "index.css")
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.join(SRC_DIR, "tsconfig.json")
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.ts'],
    },
    output: {
        filename: 'index.js',
        path: BUILD_DIR,
    },
    plugins: [
        new HtmlWebpackPlugin({
            version,
            template: path.join(SRC_DIR, "index.html"),
            inject: false
        }),
        new MiniCssExtractPlugin({
            filename: "index.css", // determines the output file name
        })
    ],
    optimization: {
        minimize: PROD,
        minimizer: [
            new CssMinimizerPlugin(),
            new HtmlMinimizerPlugin(),
            new TerserPlugin()
        ]
    }
}
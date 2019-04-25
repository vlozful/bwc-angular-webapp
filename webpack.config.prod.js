'use strict';

// Modules
const path = require("path");
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const apiMocker = require('connect-api-mocker');
const ClosureCompiler = require('closure-webpack-plugin');

var outputPath = "./build/prod/"

module.exports = {
    mode: "production",
    entry: {
        app: "./src/js/main.js"
    },
    output: {
        filename: "js/app.js",
        path: path.resolve(__dirname, outputPath),
        publicPath: ""
    },
    devServer: {
        before: function(app, server) {
            app.use(apiMocker('/api', {
                target: 'src/mocks/api',
                verbose: true
              }));
        },
        contentBase: path.join(__dirname, outputPath),
        compress: true,
        overlay: false,
        stats: {
          colors: true
        }
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['auto-ngtemplate-loader']
            },
            {
                test: /\.tmpl.html$/,
                exclude: /node_modules/,
                use: [
                  {
                    loader: 'ngtemplate-loader',
                    options: {
                      relativeTo: 'src/templates/'
                    }
                  },
                  {
                    loader: 'html-loader'
                  }
                ]
              },
              {
                test: /(browserconfig.xml|manifest.json)/,
                type: 'javascript/auto',
                use: [
                  {
                    loader: "file-loader",
                    options: {
                      name: '[name].[ext]',
                      outputPath: 'i/favicons'
                    },
                  },
                  {
                    loader: path.resolve('./src/webpack/favicons-manifest-loader/index.js')
                  },
                ]
              },
              {
                test: /\.(ico|png|jpg|gif|svg)$/,
                exclude: /sprites-gen/,
                use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[ext]?[hash]',
                            context: 'src'
                        }
                    }]
              },
              {
                test: /(sprites-gen).*\.(png)$/,
                use: [{
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]?[hash]',
                            context: 'src',
                            outputPath: 'i'
                        }
                    }]
              },
              {
                test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts'
                    }
                }]
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader" // creates style nodes from JS strings
                    },
                    {
                        loader: "css-loader", // translates CSS into CommonJS
                        options: {
                            url: true
                        }
                    },
                    {
                    loader: "sass-loader", // compiles Sass to CSS
                    options:{
                        includePaths: [
                          path.resolve(__dirname, './node_modules/compass-mixins/lib'),
                          path.resolve(__dirname, './src/sprites-gen')
                        ]
                        }
                    }
                ]
            }
        ],
    },
    optimization: {
      /*
        splitChunks: {
            chunks: 'initial',
            minSize: 100,
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'lib',
                    filename: 'js/lib.js',
                    enforce: true,
                    priority: 100
                },
                templates: {
                    test: /[\\/]templates[\\/]/,
                    name: 'templates',
                    filename: 'js/templates.js',
                    enforce: true,
                    priority:90
                }
            }
        }
        */
    },
    resolve: {
        modules: ["node_modules", "sprites-gen"]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new SpritesmithPlugin({
            src: {
                cwd: path.resolve(__dirname, 'src/i/sprites'),
                glob: '*.png'
            },
            target: {
                image: path.resolve(__dirname, 'src/sprites-gen/sprite.png'),
                css: [[path.resolve(__dirname, 'src/sprites-gen/_sprites.scss'), {
                        format: 'scss'
                    }]
                ]
            },
            retina: '@2x',
            apiOptions: {
                cssImageRef:  '~sprite.png'
            },
            spritesmithOptions: {
              padding: 2
            },
            logCreatedFiles: true
        }),
        new HtmlWebpackPlugin({
          template: "./src/html/index.html",
          title: "Book with Coffee"
        })
      ]
}
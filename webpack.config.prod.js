'use strict';

// Modules
const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const apiMocker = require('connect-api-mocker');
const ClosurePlugin = require('closure-webpack-plugin');

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
    performance: {
      hints: false,
    },
    optimization: {
      minimizer: [
        new ClosurePlugin({mode: 'AGGRESSIVE_BUNDLE'}, {
          // compiler flags here
          //
          // for debugging help, try these:
          //
          // formatting: 'PRETTY_PRINT'
          // debug: true,
          // renaming: false
        })
      ]
    },
    devServer: {
      onBeforeSetupMiddleware: function(server) {
        server.app.use(apiMocker('/api', {
            target: 'src/mocks/api',
            verbose: true
          }));
      },
      compress: true,
      hot: true
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
                    esModule: false,
                    name: '[name].[ext]',
                    outputPath: 'i/favicons'
                  },
                },
                {
                  loader: path.resolve('./src/webpack/favicons-manifest-loader/index.js'),
                  options: {
                    outputPath: 'i/favicons'
                  }
                },
              ]
            },
            {
              test: /\.(ico|png|jpg|gif|svg)$/,
              exclude: [/sprites-gen/, /favicons/],
              type: 'asset/resource',
              generator: {
                filename: 'i/[name][ext]?[hash]]'
              }
            },
            {
              test: /(favicons).*.(ico|png|jpg|gif|svg)$/,
              type: 'asset/resource',
              generator: {
                filename: 'i/favicons/[name][ext]?[hash]]'
              }
            },
            {
              test: /(sprites-gen).*\.(png)$/,
              type: 'asset/resource',
              generator: {
                filename: 'i/[name][ext]?[hash]]'
              }
            },
            {
              test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
              type: 'asset/resource',
              generator: {
                filename: 'fonts/[name][ext]?[hash]]'
              }
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
                  options: {
                      sassOptions: {
                        includePaths: [
                          path.resolve(__dirname, './node_modules/compass-mixins/lib'),
                          path.resolve(__dirname, './src/sprites-gen')
                        ]}
                      }
                  }
              ]
          }
      ],
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
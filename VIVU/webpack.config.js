const Path = require('path');
const Webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const sourceFolder = Path.resolve(__dirname, 'src');
const outFolder = Path.resolve(__dirname, 'app');
const assetFolders = ['css', 'img', 'js'];

const package = require('./package.json');


let files = assetFolders.map(folder => new Object({ from: Path.join(sourceFolder, folder), to: folder }));


files.push({
  from: 'src/main.js',
  to: outFolder
});
files.push({
  from: 'src/preload.js',
  to: outFolder
});

files.push({
  from: 'src/package.json',
  to: outFolder
});


module.exports = {
  watch: false,
  mode: "development",
  entry: {
    kollkovium: Path.join(sourceFolder, 'client', 'app'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader'
        }
      },
    ],
  },
  plugins: [
    new CopyPlugin(files),

    new HtmlWebpackPlugin({
      template: Path.join(sourceFolder, 'index.html')
    }),
    new Webpack.DefinePlugin({
      'process.env.APPINSIGHTS_INSTRUMENTATIONKEY': JSON.stringify(process.env.APPINSIGHTS_INSTRUMENTATIONKEY),
      'process.env.KOLLOKVIUM_VERSION': JSON.stringify(process.env.KOLLOKVIUM_VERSION || package.version)
    })
  ],
  resolve: {
    extensions: ['.js', '.ts'],
  },
  output: {
    path: outFolder,
    filename: 'js/[name]-bundle.js'
  }
}

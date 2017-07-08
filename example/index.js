const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleWare = require('webpack-hot-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const config = require('./webpack.config.js');
const app = express();

const compiler = webpack(config);
const clientCompiler = compiler.compilers.find(compiler => compiler.name === 'client');

app.use(webpackDevMiddleware(compiler, {
	noInfo: true,
	publicPath: config[0].output.publicPath
}));
app.use(webpackHotMiddleWare(clientCompiler, {
	noInfo: true,
	publicPath: config[0].output.publicPath
}));
app.use(webpackHotServerMiddleware(compiler, {
	serverRendererOptions: {
		foo: 'Bar'
	}
}));

app.listen(6060, () => {
	console.log('Server started: http://localhost:6060/');
});

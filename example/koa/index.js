const Koa = require('koa');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const config = require('../webpack.config.js');
const app = new Koa();

// Must point to the koa server renderer.
config[1].entry = './koa/server';

const compiler = webpack(config);

function koaDevware(dev, compiler) {
  const waitMiddleware = () =>
    new Promise((resolve, reject) => {
      dev.waitUntilValid(() => resolve(true));
      compiler.plugin('failed', error => reject(error));
    });

  return async (ctx, next) => {
    await waitMiddleware();
    await dev(
      ctx.req,
      {
        end(content) {
          ctx.body = content;
        },
        setHeader: ctx.set.bind(ctx),
        locals: ctx.state,
      },
      next
    );
  };
}

app.use(koaDevware(webpackDevMiddleware(compiler, {
  noInfo: true
}), compiler));
app.use(webpackHotServerMiddleware(compiler, {
  createHandler: webpackHotServerMiddleware.createKoaHandler,
  serverRendererOptions: {
  foo: 'Bar'
  }
}));

app.listen(6060, () => {
  console.log('Server started: http://localhost:6060/');
});

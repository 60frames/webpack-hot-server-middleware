const debug = require('debug')('webpack-hot-server-middleware');

const createConnectHandler = (error, serverRenderer) => (req, res, next) => {
    debug(`Receive request ${req.url}`);
    if (error) {
        return next(error);
    }
    serverRenderer(req, res, next);
};

const createKoaHandler = (error, serverRenderer) => (ctx, next) => {
    debug(`Receive request ${ctx.url}`);
    if (error) {
        ctx.throw(error);
    }
    return serverRenderer(ctx, next);
};

module.exports = {
  createConnectHandler,
  createKoaHandler,
};

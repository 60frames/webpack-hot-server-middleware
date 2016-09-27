'use strict';

const debug = require('debug')('webpack-hot-server-middleware');
const path = require('path');
const requireFromString = require('require-from-string');
const MultiCompiler = require('webpack/lib/MultiCompiler');

const DEFAULTS = {
    chunkName: 'main'
};

function findCompiler(multiCompiler, name) {
    return multiCompiler.compilers.find(compiler => compiler.name === name);
}

function findStats(multiStats, name) {
    return multiStats.stats.find(stats => stats.compilation.name === name);
}

function getChunkFilename(stats, outputPath, chunkName) {
    const assetsByChunkName = stats.toJson().assetsByChunkName;
    let filename = assetsByChunkName[chunkName] || '';
    // If source maps are generated `assetsByChunkName.main`
    // will be an array of filenames.
    return path.join(
        outputPath,
        Array.isArray(filename) ?
            filename.find(asset => /\.js$/.test(asset)) : filename
    );
}

/**
 * Passes the request to the most up to date 'server' bundle.
 * NOTE: This must be mounted after webpackDevMiddleware to ensure this
 * middleware doesn't get called until the compilation is complete.
 * @param   {MultiCompiler} multiCompiler      e.g webpack([clientConfig, serverConfig])
 * @options {String}        options.chunkName  The name of the main server chunk.
 * @return  {Function}                         Middleware fn.
 */
function webpackHotServerMiddleware(multiCompiler, options) {
    debug('Using webpack-hot-server-middleware');

    options = Object.assign({}, DEFAULTS, options);

    if (!multiCompiler instanceof MultiCompiler) {
        throw new Error('Expected webpack compiler to contain both a `client` and `server` config');
    }

    const serverCompiler = findCompiler(multiCompiler, 'server');
    const clientCompiler = findCompiler(multiCompiler, 'client');

    if (!serverCompiler) {
        throw new Error('Expected a webpack compiler named `server`');
    }
    if (!clientCompiler) {
        throw new Error('Expected a webpack compiler named `client`');
    }

    const outputFs = serverCompiler.outputFileSystem;
    const outputPath = serverCompiler.outputPath;

    let universalRenderer;
    let error = false;

    multiCompiler.plugin('done', multiStats => {
        const clientStats = findStats(multiStats, 'client');
        const serverStats = findStats(multiStats, 'server');
        // Server compilation errors need to be propagated to the client.
        if (serverStats.compilation.errors.length) {
            error = serverStats.compilation.errors[0];
            return;
        }
        error = false;
        const filename = getChunkFilename(serverStats, outputPath, options.chunkName);
        try {            
            const data = outputFs.readFileSync(filename);
            universalRenderer = requireFromString(data.toString(), filename).default(clientStats.toJson());
        } catch (e) {
            debug(e);
            error = e;
        }
    });

    return (req, res, next) => {
        debug(`Receive request ${req.url}`);
        if (error) {
            return next(error);
        }
        universalRenderer(req, res, next);
    };
}

module.exports = webpackHotServerMiddleware;

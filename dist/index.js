'use strict';

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _requireFromString = require('require-from-string');

var _requireFromString2 = _interopRequireDefault(_requireFromString);

var _MultiCompiler = require('webpack/lib/MultiCompiler');

var _MultiCompiler2 = _interopRequireDefault(_MultiCompiler);

var _sourceMapSupport = require('source-map-support');

var _sourceMapSupport2 = _interopRequireDefault(_sourceMapSupport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: Work out why `declare`ing this in a separate lib fails cover middleware functions.
// https://github.com/flowtype/flow-typed/issues/377
var logger = (0, _debug2.default)('webpack-hot-server-middleware');

var DEFAULTS = {
    chunkName: 'main'
};

function interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj.default : obj;
}

function findCompiler(multiCompiler, name) {
    return multiCompiler.compilers.find(function (compiler) {
        return compiler.name === name;
    });
}

function findStats(multiStats, name) {
    var stats = multiStats.stats.find(function (stats) {
        return stats.compilation.name === name;
    });
    if (!stats) {
        throw new Error('Unable to find stats for \'' + name + '\' compilation.');
    }
    return stats;
}

function getFilename(serverStats, outputPath, chunkName) {
    var assetsByChunkName = serverStats.toJson().assetsByChunkName;
    var filename = assetsByChunkName[chunkName];
    // If source maps are generated `assetsByChunkName.main` will be an array
    // of filenames.
    if (Array.isArray(filename)) {
        filename = filename.find(function (asset) {
            return (/\.js$/.test(asset)
            );
        });
    }
    if (!filename) {
        throw new Error('Unable to find \'' + chunkName + '\' chunk.');
    }
    return _path2.default.join(outputPath, filename);
}

function getServerRenderer(filename, buffer, clientStats) {
    var errMessage = 'The \'server\' compiler must export a function in the form of `(stats) => (req, res, next) => void 0`';

    var serverRenderer = interopRequireDefault((0, _requireFromString2.default)(buffer.toString(), filename));
    if (typeof serverRenderer !== 'function') {
        throw new Error(errMessage);
    }

    serverRenderer = serverRenderer(clientStats.toJson());
    if (typeof serverRenderer !== 'function') {
        throw new Error(errMessage);
    }

    return serverRenderer;
}

function installSourceMapSupport(fs) {
    _sourceMapSupport2.default.install({
        // NOTE: If https://github.com/evanw/node-source-map-support/pull/149
        // lands we can be less aggressive and explicitly invalidate the source
        // map cache when Webpack recompiles.
        emptyCacheBetweenOperations: true,
        retrieveSourceMap: function retrieveSourceMap(source) {
            try {
                return {
                    url: source,
                    map: fs.readFileSync(source + '.map', 'utf-8')
                };
            } catch (ex) {
                // Doesn't exist
            }
        }
    });
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
    logger('Using webpack-hot-server-middleware');

    options = Object.assign({}, DEFAULTS, options);

    if (!(multiCompiler instanceof _MultiCompiler2.default)) {
        throw new Error('Expected webpack compiler to contain both a \'client\' and \'server\' config');
    }

    var serverCompiler = findCompiler(multiCompiler, 'server');
    var clientCompiler = findCompiler(multiCompiler, 'client');

    if (!serverCompiler) {
        throw new Error('Expected a webpack compiler named \'server\'');
    }
    if (!clientCompiler) {
        throw new Error('Expected a webpack compiler named \'client\'');
    }

    var outputFs = serverCompiler.outputFileSystem;
    var outputPath = serverCompiler.outputPath;

    installSourceMapSupport(outputFs);

    var serverRenderer = void 0;
    var error = false;

    multiCompiler.plugin('done', function (multiStats) {
        error = false;
        var clientStats = findStats(multiStats, 'client');
        var serverStats = findStats(multiStats, 'server');
        // Server compilation errors need to be propagated to the client.
        if (serverStats.compilation.errors.length) {
            error = serverStats.compilation.errors[0];
            return;
        }
        var filename = getFilename(serverStats, outputPath, options.chunkName);
        var buffer = outputFs.readFileSync(filename);
        try {
            serverRenderer = getServerRenderer(filename, buffer, clientStats);
        } catch (ex) {
            logger(ex);
            error = ex;
        }
    });

    return function (req, res, next) {
        logger('Receive request ' + req.url);
        if (error) {
            next(error);
            return;
        }
        if (!serverRenderer) {
            next(new Error('webpack-hot-server-middleware reached before Webpack finished compiling.'));
            return;
        }
        serverRenderer(req, res, next);
    };
}

module.exports = webpackHotServerMiddleware;
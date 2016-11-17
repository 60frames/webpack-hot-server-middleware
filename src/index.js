/* @flow */

import type {
    MultiStats,
    Stats,
    Compiler
} from 'webpack/lib/MultiCompiler';
import type {
    $Request,
    $Response,
    NextFunction
} from 'express';
// TODO: Work out why `declare`ing this in a separate lib fails cover middleware functions.
// https://github.com/flowtype/flow-typed/issues/377
type Middleware = (req: $Request, res: $Response, next: NextFunction) => mixed;

import debug from 'debug';
import path from 'path';
import requireFromString from 'require-from-string';
import MultiCompiler from 'webpack/lib/MultiCompiler';
import sourceMapSupport from 'source-map-support';

const logger = debug('webpack-hot-server-middleware');

const DEFAULTS = {
    chunkName: 'main'
};

function interopRequireDefault(obj: any): any {
    return obj && obj.__esModule ? obj.default : obj;
}

function findCompiler(multiCompiler: MultiCompiler, name: string): ?Compiler {
    return multiCompiler.compilers.find(compiler => compiler.name === name);
}

function findStats(multiStats: MultiStats, name: string): Stats {
    const stats = multiStats.stats.find(stats => stats.compilation.name === name);
    if (!stats) {
        throw new Error(`Unable to find stats for '${name}' compilation.`);
    }
    return stats;
}

function getFilename(serverStats, outputPath: string, chunkName: string) {
    const assetsByChunkName = serverStats.toJson().assetsByChunkName;
    let filename: ?(string | Array<string>) = assetsByChunkName[chunkName];
    // If source maps are generated `assetsByChunkName.main` will be an array
    // of filenames.
    if (Array.isArray(filename)) {
        filename = filename.find(asset => /\.js$/.test(asset));
    }
    if (!filename) {
        throw new Error(`Unable to find '${chunkName}' chunk.`);
    }
    return path.join(
        outputPath,
        filename
    );
}

function getServerRenderer(filename: string, buffer: Buffer, clientStats: Stats): Middleware {
    const errMessage = `The 'server' compiler must export a function in the form of \`(stats) => (req, res, next) => void 0\``;

    let serverRenderer = interopRequireDefault(
        requireFromString(buffer.toString(), filename)
    );
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
    sourceMapSupport.install({
        // NOTE: If https://github.com/evanw/node-source-map-support/pull/149
        // lands we can be less aggressive and explicitly invalidate the source
        // map cache when Webpack recompiles.
        emptyCacheBetweenOperations: true,
        retrieveSourceMap(source) {
            try {
                return {
                    url: source,
                    map: fs.readFileSync(`${source}.map`, 'utf-8')
                };
            } catch(ex) {
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
function webpackHotServerMiddleware(multiCompiler: MultiCompiler, options: { chunkName: string }): Middleware {
    logger('Using webpack-hot-server-middleware');

    options = Object.assign({}, DEFAULTS, options);

    if (!(multiCompiler instanceof MultiCompiler)) {
        throw new Error(`Expected webpack compiler to contain both a 'client' and 'server' config`);
    }

    const serverCompiler = findCompiler(multiCompiler, 'server');
    const clientCompiler = findCompiler(multiCompiler, 'client');

    if (!serverCompiler) {
        throw new Error(`Expected a webpack compiler named 'server'`);
    }
    if (!clientCompiler) {
        throw new Error(`Expected a webpack compiler named 'client'`);
    }

    const outputFs = serverCompiler.outputFileSystem;
    const outputPath = serverCompiler.outputPath;

    installSourceMapSupport(outputFs);

    let serverRenderer: ?Middleware;
    let error: Error | false = false;

    multiCompiler.plugin('done', multiStats => {
        error = false;
        const clientStats = findStats(multiStats, 'client');
        const serverStats = findStats(multiStats, 'server');
        // Server compilation errors need to be propagated to the client.
        if (serverStats.compilation.errors.length) {
            error = serverStats.compilation.errors[0];
            return;
        }
        const filename = getFilename(serverStats, outputPath, options.chunkName);
        const buffer = outputFs.readFileSync(filename);
        try {
            serverRenderer = getServerRenderer(filename, buffer, clientStats);
        } catch (ex) {
            logger(ex);
            error = ex;
        }
    });

    return (req, res, next) => {
        logger(`Receive request ${req.url}`);
        if (error) {
            next(error);
            return;
        }
        if (!serverRenderer) {
            next(new Error('webpack-hot-server-middleware reached before Webpack finished compiling.'));
            return;
        }
        serverRenderer(req, res, next);
    }
}

module.exports = webpackHotServerMiddleware;

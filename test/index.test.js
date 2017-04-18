'use strict';

const express = require('express');
const webpack = require('webpack');
const request = require('supertest');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotServerMiddleware = require('../src');

const commonJsConfig = require('./fixtures/commonjs/webpack.config.js');
const esModulesConfig = require('./fixtures/esmodules/webpack.config.js');
const sourceMapConfig = require('./fixtures/sourcemap/webpack.config.js');
const compiletimeErrorConfig = require('./fixtures/compiletimeerror/webpack.config.js');
const runtimeErrorConfig = require('./fixtures/runtimeerror/webpack.config.js');
const noMultiCompilerConfig = require('./fixtures/nomulticompiler/webpack.config.js');
const incorrectServerCompilerNameConfig = require('./fixtures/incorrectservercompilername/webpack.config.js');
const incorrectClientCompilerNameConfig = require('./fixtures/incorrectclientcompilername/webpack.config.js');
const badExportConfig = require('./fixtures/badexport/webpack.config.js');

function createServer(config, mountWebpackDevMiddleware = true) {
    const compiler = webpack(config);
    const app = express();
    let webpackDev;
    if (mountWebpackDevMiddleware) {
        webpackDev = webpackDevMiddleware(compiler, {
            quiet: true
        });
        app.use(webpackDev);
    }
    app.use(webpackHotServerMiddleware(compiler));
    app.use((err, req, res, next) => {
        res.status(500).send(err.toString());
    });
    return [app, (cb) => {
        // HACK: Process won't terminate unless `close` is successful however
        // 'chokidar' has a bug whereby calling `close` before the watcher is
        // ready fails so having to wait for...a bit.
        // https://github.com/webpack/webpack/issues/1920
        // https://github.com/paulmillr/chokidar/pull/536
        setTimeout(() => {
            if (webpackDev) {
                webpackDev.close(cb);
                return;
            }
            if (cb) {
                cb();
            }
        }, 100);
    }];
}

describe('index', () => {

    it('throws when the compiler isn\'t a `MultiCompiler`', () => {
        // Avoid mounting webpackDevMiddleware as we expect it to throw so would
        // lose the opportunity to close the connection.
        expect(createServer.bind(null, noMultiCompilerConfig, false)).toThrow(
            new Error(`Expected webpack compiler to contain both a 'client' and 'server' config`)
        );
    });

    it('throws when server compiler cannot be found', () => {
        expect(createServer.bind(null, incorrectServerCompilerNameConfig, false)).toThrow(
            new Error(`Expected a webpack compiler named 'server'`)
        );
    });

    it('throws when client compiler cannot be found', () => {
        expect(createServer.bind(null, incorrectClientCompilerNameConfig, false)).toThrow(
            new Error(`Expected a webpack compiler named 'client'`)
        );
    });

    it('handles commonJs exports', done => {
        const [app, close] = createServer(commonJsConfig);
        request(app)
            .get('/')
            .expect(200)
            .expect('Hello Server')
            .end((err, res) => {
                close(() => {
                    if (err) {
                        done.fail(err);
                        return;
                    }
                    done();
                });
            });
    });

    it('handles es modules exports', done => {
        const [app, close] = createServer(esModulesConfig);
        request(app)
            .get('/')
            .expect(200)
            .expect('Hello Server')
            .end((err, res) => {
                close(() => {
                    if (err) {
                        done.fail(err);
                        return;
                    }
                    done();
                });
            });
    });

    it('handles source maps', done => {
        const [app, close] = createServer(sourceMapConfig);
        request(app)
            .get('/')
            .expect(200)
            .expect('Hello Server')
            .end((err, res) => {
                close(() => {
                    if (err) {
                        done.fail(err);
                        return;
                    }
                    done();
                });
            });
    });

    it('handles compile time errors', done => {
        const [app, close] = createServer(compiletimeErrorConfig);
        request(app)
            .get('/')
            .expect(500)
            .expect(/ModuleParseError/)
            .end((err, res) => {
                close(() => {
                    if (err) {
                        done.fail(err);
                        return;
                    }
                    done();
                });
            });
    });

    it('handles runtime errors', done => {
        const [app, close] = createServer(runtimeErrorConfig);
        request(app)
            .get('/')
            .expect(500)
            .expect('Error: ¯\\_(ツ)_/¯')
            .end((err, res) => {
                close(() => {
                    if (err) {
                        done.fail(err);
                        return;
                    }
                    done();
                });
            });
    });

    it(`handles bad server exports`, done => {
        const [app, close] = createServer(badExportConfig);
        request(app)
            .get('/')
            .expect(500)
            .expect(`Error: The 'server' compiler must export a function in the form of \`(options) => (req, res, next) => void\``)
            .end((err, res) => {
                close(() => {
                    if (err) {
                        done.fail(err);
                        return;
                    }
                    done();
                });
            });
    });

});

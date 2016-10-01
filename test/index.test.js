'use strict';

const express = require('express');
const webpack = require('webpack');
const request = require('supertest');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotServerMiddleware = require('../src');

const defaultConfig = require('./fixtures/default/webpack.config.js');
const compiletimeErrorConfig = require('./fixtures/compiletimeerror/webpack.config.js');
const runtimeErrorConfig = require('./fixtures/runtimeerror/webpack.config.js');
const noMultiCompilerConfig = require('./fixtures/nomulticompiler/webpack.config.js');
const incorrectServerCompilerNameConfig = require('./fixtures/incorrectservercompilername/webpack.config.js');
const incorrectClientCompilerNameConfig = require('./fixtures/incorrectclientcompilername/webpack.config.js');
const badExportConfig = require('./fixtures/badexport/webpack.config.js');

function createServer(config, options) {
    const compiler = webpack(config);
    const app = express();
    app.use(webpackDevMiddleware(compiler, {
        quiet: true
    }));
    app.use(webpackHotServerMiddleware(compiler, options));
    app.use((err, req, res, next) => {
        res.status(500).send(err.toString());
    });
    return app;
}

describe('index', () => {

    it('throws when the compiler isn\'t a `MultiCompiler`', () => {
        expect(createServer.bind(null, noMultiCompilerConfig)).toThrow(
            new Error(`Expected webpack compiler to contain both a 'client' and 'server' config`)
        );
    });

    it('throws when server compiler cannot be found', () => {
        expect(createServer.bind(null, incorrectServerCompilerNameConfig)).toThrow(
            new Error(`Expected a webpack compiler named 'server'`)
        );
    });

    it('throws when client compiler cannot be found', () => {
        expect(createServer.bind(null, incorrectClientCompilerNameConfig)).toThrow(
            new Error(`Expected a webpack compiler named 'client'`)
        );
    });

    it('works', done => {
        const app = createServer(defaultConfig);
        request(app)
            .get('/')
            .expect(200)
            .expect('Hello Server')
            .end((err, res) => {
                if (err) {
                    done.fail(err);
                }
                done();
            });
    });

    it('handles compile time errors', done => {
        const app = createServer(compiletimeErrorConfig);
        request(app)
            .get('/')
            .expect(500)
            .expect(/ModuleParseError/)
            .end((err, res) => {
                if (err) {
                    done.fail(err);
                }
                done();
            });
    });

    it('handles runtime errors', done => {
        const app = createServer(runtimeErrorConfig);
        request(app)
            .get('/')
            .expect(500)
            .expect('Error: ¯\\_(ツ)_/¯')
            .end((err, res) => {
                if (err) {
                    done.fail(err);
                }
                done();
            });
    });

    it(`handles bad server exports`, done => {
        const app = createServer(badExportConfig);
        request(app)
            .get('/')
            .expect(500)
            .expect(`Error: The 'server' compiler must export a function in the form of \`(stats) => (req, res, next) => void 0\``)
            .end((err, res) => {
                if (err) {
                    done.fail(err);
                }
                done();
            });
    });

});

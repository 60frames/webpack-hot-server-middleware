# Webpack Hot Server Middleware
[![Build Status](https://travis-ci.org/60frames/webpack-hot-server-middleware.svg?branch=master)](https://travis-ci.org/60frames/webpack-hot-server-middleware) [![npm version](https://badge.fury.io/js/webpack-hot-server-middleware.svg)](https://www.npmjs.com/package/webpack-hot-server-middleware) [![Coverage Status](https://coveralls.io/repos/github/60frames/webpack-hot-server-middleware/badge.svg?branch=master)](https://coveralls.io/github/60frames/webpack-hot-server-middleware?branch=master) [![npm downloads](https://img.shields.io/npm/dm/webpack-hot-server-middleware.svg)](https://www.npmjs.com/package/webpack-hot-server-middleware)

Webpack Hot Server Middleware is designed to be used in conjunction with [`webpack-dev-middleware`](https://github.com/webpack/webpack-dev-middleware/) (and optionally [`webpack-hot-middleware`](https://github.com/glenjamin/webpack-hot-middleware/)) to hot update Webpack bundles on the server.

## Why?

When creating universal Web apps it's common to build two bundles with Webpack, one client bundle [targeting](https://webpack.github.io/docs/configuration.html#target) 'web' and another server bundle targeting 'node'.

The entry point to the client bundle renders to the DOM, e.g.

```js
// client.js

import ReactDOM from 'react-dom';
import App from './components/App';

ReactDOM.render(<App />, document.getElementById('root'));
```

And the entry point to the server bundle renders to string, e.g.

```js
// server.js

import { renderToString } from 'react-dom/server';
import App from './components/App';

export default function serverRenderer() {
    return (req, res, next) => {
        res.status(200).send(`
            <!doctype html>
            <html>
            <head>
                <title>App</title>
            </head>
            <body>
                <div id="root">
                    ${renderToString(<App />)}
                </div>
                <script src="/client.js"></script>
            </body>
            </html>
        `);
    };
}
```

> NOTE: The server bundle is itself middleware allowing you to mount it anywhere in an existing node server, e.g.

```js
const express = require('express');
const serverRenderer = require('./dist/server');
const app = express();

app.use(serverRenderer());
app.listen(6060);
```

Given this setup it's fairly easy to hook up hot module replacement for your client bundle using `webpack-dev-server` or `webpack-hot-middleware` however these middlewares don't handle server bundles meaning you need to frequently restart your server to see the latest changes.

Webpack Hot Server Middleware solves this problem, ensuring the server bundle used is always the latest compilation without requiring a restart. Additionally it allows your client and server bundle to share the same Webpack cache for faster builds and uses an in-memory bundle on the server to avoid hitting the disk.

## How?

It turns out hot module replacement is much easier on the server than on the client as you don't have any state to preserve because middleware is almost always necessarily stateless, so the entire bundle can be replaced at the top level whenever a change occurs.

### Usage

Webpack Hot Server Middleware expects your Webpack config to export an [array of configurations](http://webpack.github.io/docs/configuration.html#multiple-configurations), one for your client bundle and one for your server bundle, e.g.

```js
// webpack.config.js

module.exports = [
    {
        name: 'client',
        target: 'web',
        entry: './client.js'
        ...
    }, {
        name: 'server',
        target: 'node',
        entry: './server.js'
        ...
    }
];
```

> NOTE: It's important both the 'client' and 'server' configs are given a name prefixed with 'client' and 'server' respectively.

It then needs to be mounted immediately after `webpack-dev-middleware`, e.g.

```js
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const config = require('./webpack.config.js');
const app = express();

const compiler = webpack(config);

app.use(webpackDevMiddleware(compiler, {
  serverSideRender: true
}));
app.use(webpackHotServerMiddleware(compiler));

app.listen(6060);
```

Now whenever Webpack rebuilds, the new bundle will be used both client and *server* side.

### API

**webpackHotServerMiddleware** `(compiler: MultiCompiler, options?: Options) => void`

#### Options

**chunkName** `string`
The name of the server entry point, defaults to 'main'.

**serverRendererOptions** `object`
Mixed in with `clientStats` & `serverStats` and passed to the `serverRenderer`.

### Example

A simple example can be found in the [example](example) directory and a more real world example can be seen in the [60fram.es boilerplate](https://github.com/60frames/react-boilerplate).

### Usage with `webpack-hot-middleware`

`webpack-hot-middleware` needs to be mounted *before* `webpack-hot-server-middleware` to ensure client hot module replacement requests are handled correctly, e.g.

```js
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
const config = require('./webpack.config.js');
const app = express();

const compiler = webpack(config);

app.use(webpackDevMiddleware(compiler, {
  serverSideRender: true
}));
// NOTE: Only the client bundle needs to be passed to `webpack-hot-middleware`.
app.use(webpackHotMiddleware(compiler.compilers.find(compiler => compiler.name === 'client')));
app.use(webpackHotServerMiddleware(compiler));

app.listen(6060);
```

### Production Setup

A production setup might conditionally use [`express.static`](https://expressjs.com/en/starter/static-files.html) instead of `webpack-dev-server` and a pre-built server bundle instead of `webpack-hot-server-middleware`, e.g.

```js
const express = require('express');
const path = require('path');
const app = express();

if (process.env.NODE_ENV !== 'production') {
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const webpackHotServerMiddleware = require('webpack-hot-server-middleware');
    const config = require('./webpack.config.js');
    const compiler = webpack(config);
    app.use(webpackDevMiddleware(compiler, {
      serverSideRender: true
    }));
    app.use(webpackHotMiddleware(compiler.compilers.find(compiler => compiler.name === 'client')));
    app.use(webpackHotServerMiddleware(compiler));
} else {
    const CLIENT_ASSETS_DIR = path.join(__dirname, '../build/client');
    const CLIENT_STATS_PATH = path.join(CLIENT_ASSETS_DIR, 'stats.json');
    const SERVER_RENDERER_PATH = path.join(__dirname, '../build/server.js');
    const serverRenderer = require(SERVER_RENDERER_PATH);
    const stats = require(CLIENT_STATS_PATH);
    app.use(express.static(CLIENT_ASSETS_DIR));
    app.use(serverRenderer(stats));
}

app.listen(6060);
```

## License

MIT

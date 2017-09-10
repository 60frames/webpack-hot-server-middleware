const React = require('react');
const renderToString = require('react-dom/server').renderToString;
const App = require('./components/App');

const syncMiddleware = ({ clientStats, serverStats, foo }) => (req, res, next) => {
	console.log('Execute Middleware');
	res.status(200).send(`
          <!doctype html>
          <html>
          <head>
              <title>${foo}</title>
          </head>
          <body>
              <div id="root">${renderToString(React.createElement(App))}</div>
              <script src="/client.js"></script>
          </body>
          </html>
      `);
};

const asyncMiddleware = options => {
	console.log('Middleware is async');
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(syncMiddleware(options));
		}, 10);
	});
};

const syncServerRenderer = middleware => options => {
	console.log('Execute ServerRenderer');
	return middleware(options);
};

const asyncServerRenderer = middleware => options => {
	console.log('ServerRenderer is async');
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(syncServerRenderer(middleware)(options));
		}, 10);
	});
};

const getServerRenderer = (serverRendererIsAsync, middlewareIsAsync) => {
	let serverRenderer, middleware;

	serverRendererIsAsync ? (serverRenderer = asyncServerRenderer) : (serverRenderer = syncServerRenderer);

	middlewareIsAsync ? (middleware = asyncMiddleware) : (middleware = syncMiddleware);

	return serverRenderer(middleware);
};

// getServerRenderer(serverRendererIsAsync, middlewareIsAsync) : (options) => middleware
module.exports = getServerRenderer(true, true);

/*
These functions are for demonstration purpose
you can just export default your serverRender function as the following

// es6 env
export default async? (options) => async? (req, res, next) => ...
*/

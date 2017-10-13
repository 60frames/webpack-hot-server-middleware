const React = require('react');
const renderToString = require('react-dom/server').renderToString;
const App = require('../components/App');

const serverRenderer = ({ clientStats, serverStats, foo }) =>
  async (ctx, next) => {
    ctx.body = `
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
    `;
    await next();
  }

module.exports = serverRenderer;

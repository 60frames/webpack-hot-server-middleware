const React = require('react');
const renderToString = require('react-dom/server').renderToString;
const App = require('./components/App');

module.exports = function serverRenderer(stats) {
    return (req, res, next) => {
        res.status(200).send(`
            <!doctype html>
            <html>
            <head>
                <title>App</title>
            </head>
            <body>
                <div id="root">${renderToString(React.createElement(App))}</div>
                <script src="/client.js"></script>
            </body>
            </html>
        `);
    };
}
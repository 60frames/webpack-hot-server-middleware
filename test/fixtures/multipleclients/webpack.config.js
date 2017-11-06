const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: 'client-mobile',
        target: 'web',
        context: __dirname,
        entry: './mobile',
        output: {
            path: dist,
            filename: 'mobile.js'
        }
    }, {
        name: 'client-desktop',
        target: 'web',
        context: __dirname,
        entry: './desktop',
        output: {
            path: dist,
            filename: 'desktop.js'
        }
    }, {
        name: 'server',
        target: 'node',
        context: __dirname,
        entry: './server',
        output: {
            path: dist,
            filename: 'server.js',
            libraryTarget: 'commonjs2'
        }
    }
];

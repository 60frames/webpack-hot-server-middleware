const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: 'client',
        mode: 'development',
        target: 'web',
        entry: './client',
        output: {
            path: dist,
            filename: 'client.js'
        },
        devtool: 'source-map'
    }, {
        name: 'server',
        mode: 'development',
        target: 'node',
        entry: './express/server',
        output: {
            path: dist,
            filename: 'server.js',
            libraryTarget: 'commonjs2'
        },
        devtool: 'source-map'
    }
];

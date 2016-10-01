const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: '¯\_(ツ)_/¯',
        target: 'web',
        context: __dirname,
        entry: './client',
        output: {
            path: dist,
            filename: 'client.js'
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

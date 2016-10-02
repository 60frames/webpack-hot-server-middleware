const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: 'client',
        target: 'web',
        context: __dirname,
        entry: './client',
        output: {
            path: dist,
            filename: 'client.js'
        }
    }, {
        name: '¯\_(ツ)_/¯',
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

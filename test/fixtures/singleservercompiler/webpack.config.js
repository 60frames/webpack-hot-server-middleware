const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: 'server',
        target: 'node',
        mode: 'development',
        context: __dirname,
        entry: './server',
        output: {
            path: dist,
            filename: 'server.js',
            libraryTarget: 'commonjs2'
        }
    }
];

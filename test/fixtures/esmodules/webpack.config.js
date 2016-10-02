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
        name: 'server',
        target: 'node',
        context: __dirname,
        entry: './server',
        output: {
            path: dist,
            filename: 'server.js',
            libraryTarget: 'commonjs2'
        },
        module: {
            loaders: [{
                test: /\.js$/,
                exclude: 'node_modules',
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }]
        }
    }
];

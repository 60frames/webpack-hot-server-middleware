const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: 'client',
        target: 'web',
        mode: 'development',
        context: __dirname,
        entry: './client',
        output: {
            path: dist,
            filename: 'client.js'
        }
    }, {
        name: 'server',
        target: 'node',
        mode: 'development',
        context: __dirname,
        entry: './server',
        output: {
            path: dist,
            filename: 'server.js',
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    query: {
                        presets: ['babel-preset-es2015']
                    }
                }
            }]
        }
    }
];

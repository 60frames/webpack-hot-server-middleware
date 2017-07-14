const path = require('path');
const webpack = require('webpack');

const dist = path.join(__dirname, 'dist');

module.exports = [
    {
        name: 'client',
        target: 'web',
        entry: [
            'react-hot-loader/patch',
            'webpack-hot-middleware/client',
            './client',
        ],
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    loaders: ['react-hot-loader/webpack']
                }
            ]
        },
        output: {
            path: dist,
            filename: 'client.js',
            publicPath: '/assets/'
        },
        devtool: 'source-map',
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
            new webpack.NoErrorsPlugin(),
        ]
    }, {
        name: 'server',
        target: 'node',
        entry: './server',
        output: {
            path: dist,
            filename: 'server.js',
            libraryTarget: 'commonjs2'
        },
        devtool: 'source-map',
    }
];

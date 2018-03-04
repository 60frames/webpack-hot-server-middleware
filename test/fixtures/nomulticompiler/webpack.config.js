const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = {
    name: 'client',
    target: 'web',
    mode: 'development',
    context: __dirname,
    entry: './client',
    output: {
        path: dist,
        filename: 'client.js'
    }
};

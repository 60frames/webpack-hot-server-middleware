const path = require('path');

const dist = path.join(__dirname, 'dist');

module.exports = {
    name: 'client',
    target: 'web',
    context: __dirname,
    entry: './client',
    output: {
        path: dist,
        filename: 'client.js'
    }
};

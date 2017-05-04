const path = require('path');

module.exports = Object.assign({}, {
  npmDir: path.resolve(__dirname, '../../node_modules'),
  srcDir: path.resolve(__dirname, '../../client/src'),
  distDir: path.resolve(__dirname, '../../client/dist')
});

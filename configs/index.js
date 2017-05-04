const client = require('./modules/client');
const session = require('./modules/session');

module.exports = Object.assign({}, {
  client: client,
  session: session
});

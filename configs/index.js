const client = require('./modules/client');
const database = require('./modules/database');
const server = require('./modules/server');
const session = require('./modules/session');

module.exports = Object.assign({}, {
  client: client,
  database: database,
  server: server,
  session: session
});

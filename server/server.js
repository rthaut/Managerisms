const fs = require('fs');
const http = require('http');
const https = require('https');

// Configuration
const config = require('../configs');
//const privateKey = fs.readFileSync(__dirname + '/cert/privatekey.pem').toString();
//const certificate = fs.readFileSync(__dirname + '/cert/certificate.pem').toString();

const app = require('express')();
const session = require('express-session');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(errorhandler({ dumpExceptions: true, showStack: true }));

// MongoDB connection
const mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
mongoose.connect(`mongodb://${config.database.username}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.database}`);
const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'MongoDB Connection Error'));
conn.once('open', function() {
  console.log("\t" + `Connected to MongoDB "${config.database.database}" database (${config.database.host}:${config.database.port})` + "\n");
});

// Session & Storage
const mongoStore = require('connect-mongo')(session);
app.use(session({
  secret: config.session.secret,
  store: new mongoStore({ mongooseConnection: conn }),
  saveUninitialized: true,
  resave: false,
  cookie: {
    httpOnly: false,
    maxAge: config.session.maxAge
  },
}));

// API URL Routing
const db = require('./database');
require('./database/import')();
require('./routes/api').addRoutes(app, config);

// Client URL Routing
require('./routes/client').addRoutes(app, config);

// Servers
const serverHttp = http.createServer(app);
//const serverHttps = https.createServer({key: privateKey, cert: certificate}, app);

serverHttp.listen(config.server.httpPort, '0.0.0.0', 511, function () {
  //const open = require('open');
  //open('http://localhost:' + config.server.httpPort + '/');
});
console.log("\t" + `HTTP server running - listening on port: ${config.server.httpPort}` + "\n");
//serverHttps.listen(config.server.httpsPort);
//console.log("\t" + `HTTPS server running - listening on port: ${config.server.httpsPort}` + "\n");

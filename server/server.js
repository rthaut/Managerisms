const fs = require('fs');
const http = require('http');
const https = require('https');

// Configuration
const config = require('../configs');

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
mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'MongoDB Connection Error'));
conn.once('open', function() {
  console.log("\t" + `Connected to MongoDB "${process.env.DB_NAME}" database (${process.env.DB_HOST}:${process.env.DB_PORT})` + "\n");
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

// HTTP Server
const serverHttp = http.createServer(app);
serverHttp.listen(process.env.PORT_HTTP, '0.0.0.0', 511, function () {
  console.log("\t" + `HTTP server running - listening on port: ${process.env.PORT_HTTP}` + "\n");
});

/*
// HTTPS Server
const privateKey = fs.readFileSync(__dirname + '/cert/privatekey.pem').toString();
const certificate = fs.readFileSync(__dirname + '/cert/certificate.pem').toString();
const serverHttps = https.createServer({key: privateKey, cert: certificate}, app);
serverHttps.listen(process.env.PORT_HTTPS, '0.0.0.0', 511, function () {
  console.log("\t" + `HTTPS server running - listening on port: ${process.env.PORT_HTTPS}` + "\n");
});
*/

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

// Express App & Plug-Ins
const app = require('express')();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');

app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(errorhandler({ dumpExceptions: true, showStack: true }));

// MongoDB Connection & Initialization
const mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
const conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'MongoDB Connection Error'));
conn.once('open', function () {
  console.log("\t" + `Connected to MongoDB "${process.env.DB_NAME}" database (${process.env.DB_HOST}:${process.env.DB_PORT})` + "\n");
  require('./database/import')();
});

// Session & Storage
const session = require('express-session');
const mongoStore = require('connect-mongo')(session);
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new mongoStore({ mongooseConnection: conn }),
  saveUninitialized: true,
  resave: false,
  cookie: {
    httpOnly: false,
    maxAge: 5 * 365 * 24 * 60 * 60 * 1000 // ~5 years
  },
}));

// API URL Routing
require('./routes/api').addRoutes(app);

// Client URL Routing
require('./routes/client').addRoutes(app, path.resolve(__dirname, '../client'));

// HTTP Server
const serverHttp = require('http').createServer(app);
serverHttp.listen(process.env.PORT_HTTP, '127.0.0.1', 511, function () {
  console.log("\t" + "HTTP server running - listening on", this.address());
});


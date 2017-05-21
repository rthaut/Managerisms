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
  secret: process.env.SESSION_SECRET,
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

// Let's Encrypt Middleware
const lex = require('greenlock-express').create({
  //debug: true,
  //server: 'staging',
  server: 'https://acme-v01.api.letsencrypt.org/directory',

  store: require('le-store-certbot').create({
    //debug: true,
    configDir: 'etc/letsencrypt',
    webrootPath: '/tmp/letsencrypt/.well-known/acme-challenge'
  }),

  challenges: {
    'http-01': require('le-challenge-fs').create({
      //debug: true,
      webrootPath: '/tmp/letsencrypt/.well-known/acme-challenge'
    }),
    'tls-sni-01': require('le-challenge-sni').create({
      //debug: true,
    }),
    'tls-sni-02': require('le-challenge-sni').create({
      //debug: true,
    })
  },

  approveDomains: [process.env.DOMAIN]
});

// HTTP Server
const serverHttp = require('http').createServer(lex.middleware(app));
serverHttp.listen(process.env.PORT_HTTP, function () {
  console.log("\t" + "HTTP server running - listening on", this.address());
});

// HTTPS Server
const serverHttps = require('https').createServer(lex.httpsOptions, lex.middleware(app));
serverHttps.listen(process.env.PORT_HTTPS, function () {
  console.log("\t" + "HTTPS server running - listening on", this.address());
});

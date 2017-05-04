const express = require('express');
const favicon = require('serve-favicon')

exports.addRoutes = (app, config) => {

  if (process.env.CLIENT_ENV === 'src') {

    // src build
    app.use(favicon(config.client.srcDir + '/favicon.ico'));
    app.use(process.env.STATIC_URL, express.static(config.client.npmDir));
    app.use(process.env.STATIC_URL, express.static(config.client.srcDir));
    app.all('/*', (req, res) => {
      res.sendFile('index.html', { root: config.client.srcDir });
    });

  } else if (process.env.CLIENT_ENV === 'dist') {

    // dist build
    app.use(favicon(config.client.distDir + '/favicon.ico'));
    app.use(process.env.STATIC_URL, express.static(config.client.distDir));
    app.all('/*', (req, res) => {
      res.sendFile('index.html', { root: config.client.distDir });
    });

  }

};

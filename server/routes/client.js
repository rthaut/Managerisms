const express = require('express');
const favicon = require('serve-favicon')
const path = require('path');

exports.addRoutes = (app, config) => {
  // favicon
  app.use(favicon(config.client.distDir + '/favicon.ico'));

  // src build
  /*app.use(config.client.staticUrl, express.static(config.client.npmDir));
  app.use(config.client.staticUrl, express.static(config.client.srcDir));
  app.all('/*', (req, res) => {
    res.sendFile('index.html', { root: config.client.srcDir });
  });*/

  // dist build
  app.use(config.client.staticUrl, express.static(config.client.distDir));
  app.all('/*', (req, res) => {
    res.sendFile('index.html', { root: config.client.distDir });
  });

};

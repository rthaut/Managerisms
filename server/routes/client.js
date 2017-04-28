const express = require('express');
const favicon = require('serve-favicon')
const path = require('path');

//@TODO this should set the proper paths based on the build/mode (i.e. dev vs. prod [vs. local?])

exports.addRoutes = (app, config) => {
  // favicon
  //app.use(favicon(config.client.distDir + '/favicon.ico'));
  app.use(favicon(config.client.srcDir + '/favicon.ico'));

  // dist build
  //app.use(config.client.staticUrl, express.static(config.client.distDir));

  // source locations
  app.use(config.client.staticUrl, express.static(config.client.npmDir));
  app.use(config.client.staticUrl, express.static(config.client.srcDir));

  app.all('/*', (req, res) => {
    res.sendFile('index.html', { root: config.client.srcDir });
  });

};

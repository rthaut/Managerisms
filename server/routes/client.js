const express = require('express');
const favicon = require('serve-favicon');

exports.addRoutes = (app, dir) => {

  if (process.env.CLIENT_ENV === 'src') {

    // src build
    app.use(favicon(dir + '/src/favicon.ico'));
    app.use(process.env.STATIC_URL, express.static(path.resolve(__dirname, '../../node_modules')));
    app.use(process.env.STATIC_URL, express.static(dir + '/src'));
    app.all('/*', (req, res) => {
      res.sendFile('index.html', { root: dir + '/src' });
    });

  } else if (process.env.CLIENT_ENV === 'dist') {

    // dist build
    app.use(favicon(dir + '/dist/favicon.ico'));
    app.use(process.env.STATIC_URL, express.static(dir + '/dist'));
    app.all('/*', (req, res) => {
      res.sendFile('index.html', { root: dir + '/dist' });
    });

  }

};

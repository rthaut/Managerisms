const q = require('q');
const mongoose = require('mongoose');
const db = require('../database');
const helpers = require('../lib/');

exports.addRoutes = (app) => {

  //@TODO the complex aggregation used here is really only needed for sorting by rating...
  //      perhaps it would be better to use a normal find({}) for everything else instead
  app.get('/api/statements', (req, res) => {

    let direction = -1;
    if (req.query.direction) {
      switch (req.query.direction) {
        case 'up':
        case 'asc':
        case 'ascending':
          direction = 1;
          break;
      }
    }

    let sort = { 'score.points.awarded': direction };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'date':
          sort = { 'created': direction };
          break;

        case 'rating':
          sort = { 'rating.average': direction, 'rating.count': direction };
          break;
      }
    }

    let limit = Math.abs(req.query.limit) || 10;
    let offset = Math.abs(req.query.offset) || 0;

    //@TODO support for date range (i.e. today's best)?

    return db.statements.find({}, '-breakdown')
      .lean()
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .exec().then((statements) => {

        for (let i = 0; i < statements.length; i++) {

          // populate the session's rating value for the statement
          statements[i].rating.session = 0;
          if (req.session.ratings) {
            statements[i].rating.session = req.session.ratings[statements[i]._id] || 0;
          }

        }

        return res.json(statements);

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use... maybe switch on err.code?
      });

  });

  app.get('/api/statements/random', (req, res) => {

    let limit = Math.abs(req.query.limit) || 10;

    return db.statements.find({}, '-breakdown')
      .lean()
      .sort({ 'rating.average': -1 })
      .limit(limit)
      .exec().then((statements) => {

        return res.json(statements[Math.floor(Math.random() * statements.length)]);

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use... maybe switch on err.code?
      });

  });

  app.get('/api/statements/:id', (req, res) => {

    return db.statements.findById(req.params.id)
      .populate('breakdown.phrase')
      .populate('breakdown.word')
      .populate('rating.ratings')
      .lean()
      .exec().then((statement) => {

        statement.rating.session = 0;
        if (req.session.ratings) {
          statement.rating.session = req.session.ratings[statement._id] || 0;
        }

        return res.json(statement);

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use... maybe switch on err.code?
      });

  });

  app.post('/api/statements/analyze', (req, res) => {

    return helpers.statement.analyze(req.body.text)
      .then((analysis) => {
        return res.json(analysis);
      })
      .catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use
      });

  });

  app.post('/api/statements/:id/ratings', (req, res) => {

    const rating = parseInt(req.body.rating, 10);
    const session_id = req.sessionID;

    return db.statements.findById(req.params.id)
      .populate('rating.ratings')
      .exec().then((statement) => {

        if (rating === 0) {

          // delete any existing rating(s) for this statement from the session
          statement.rating.ratings = statement.rating.ratings.filter((val) => val.session_id !== session_id);

        } else {

          let updated = false;

          // update any existing rating(s) for this statement from this session
          for (let i = 0; i < statement.rating.ratings.length; i++) {
            if (statement.rating.ratings[i].session_id === session_id) {
              statement.rating.ratings[i].value = rating;
              updated = true;
            }
          }

          if (!updated) {
            // create a new rating for this statement for this session
            statement.rating.ratings.push({
              'session_id': session_id,
              'value': rating
            });
          }

        }

        statement.rating.count = statement.rating.ratings.length;

        return statement.save().then((statement) => {

          // store the statement's rating directly on the session for quick retrieval
          if (req.session.ratings === undefined) {
            req.session.ratings = {};
          }
          req.session.ratings[statement._id] = rating;

          // return the updated rating information so the client can update
          return res.json(statement.rating);

        });

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use
      });

  });

  app.post('/api/statements', (req, res) => {

    return helpers.statement.analyze(req.body.text)
      .then((analysis) => {

        if (!analysis.validation.valid) {
          throw 'Statement is not valid.'; //@TODO determine HTTP status code to use
        }

        let statement = new db.statements({
          'text': analysis.formatted,
          'author': req.body.author,
          'citation': req.body.citation,
          'session_id': req.sessionID,
          'score': analysis.score
        });

        for (let i = 0; i < analysis.breakdown.length; i++) {
          statement.breakdown.push({
            'position': i,
            'word': analysis.breakdown[i].word,
            'phrase': analysis.breakdown[i].phrase,
            'points': analysis.breakdown[i].points,
            'uses': analysis.breakdown[i].uses,
          });
        }

        return statement.save().then((statement) => {
          return res.json(statement);
        });

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use
      });

  });

};

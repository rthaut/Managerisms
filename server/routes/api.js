const q = require('q');
const mongoose = require('mongoose');
const db = require('../database');
const helpers = require('../lib/');

exports.addRoutes = (app, config) => {

  //@TODO the complex aggregation used here is really only needed for sorting by rating...
  //      perhaps it would be better to use a normal find({}) for everything else instead
  app.get('/api/statements', (req, res) => {

    let sort = { 'statement.score.points.awarded': -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'date':
          sort = { 'statement.created': -1 };
          break;

        case 'rating':
          sort = { 'statement.rating.average': -1, 'ratingCount': -1 };
          break;
      }
    }

    let limit = Math.abs(req.query.limit) || 10;
    let offset = Math.abs(req.query.offset) || 0;

    //@TODO support for date range (i.e. today's best)?

    db.statements.aggregate([

      // expand the ratings into a flat collection
      { '$unwind': '$rating.ratings' },

      // calculate the number of ratings per statement (so it can be used for sorting)
      {
        '$group': {
          '_id': '$_id',
          'ratingCount': { '$sum': 1 }
        }
      },

      // retrieve the full statement object for each result from the grouping
      { '$lookup': { 'from': 'statements', 'localField': '_id', 'foreignField': '_id', 'as': 'statement' } },

      // remove the session_id and and breakdown from the session objects
      {
        '$project': {
          'statement.session_id': 0,
          'statement.breakdown': 0
        }
      },

      { '$sort': sort },
      { '$skip': offset },
      { '$limit': limit }
    ])
      .exec().then((results) => {

        let statements = [];

        for (let i = 0; i < results.length; i++) {

          // the actual statement object is nested as the first item from an array called 'statement' (due to $lookup)
          let statement = results[i].statement[0];

          // copy in the count of ratings for ease of use
          statement.rating.count = results[i].ratingCount;

          // populate the session's rating value for the statement
          statement.rating.session = 0;
          if (req.session.ratings) {
            statement.rating.session = req.session.ratings[statement._id] || 0;
          }

          // add the massaged statement to the return array
          statements.push(statement);

        }

        return res.json(statements);

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err);
      });

  });

  app.get('/api/statements', (req, res) => {



    //@TODO determine what data needs to be returned here
    db.statements.find({}, '-breakdown')
      .populate('rating.ratings')
      .lean()
      .sort(sort)
      .exec().then((statements) => {

        if (statements == null) {
          return res.json([]);
        }

        for (let i = 0; i < statements.length; i++) {
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

    db.statements.find({}, '-breakdown')
      .lean()
      .sort({ 'rating.average': -1 })
      .limit(10)
      .exec().then((statements) => {

        return res.json(statements[Math.floor(Math.random() * statements.length)]);

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use... maybe switch on err.code?
      });

  });

  app.get('/api/statements/:id', (req, res) => {

    db.statements.findById(req.params.id)
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

    helpers.statement.analyze(req.body.text)
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

    db.statements.findById(req.params.id)
      .populate('rating.ratings')
      .exec().then((statement) => {

        if (rating === 0) {

          // delete any existing rating(s) for this statement from this session
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

        statement.save().then((statement) => {

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
        return res.status(500).send(err); //@TODO determine HTTP status code to use... maybe switch on err.code?
      });

  });

  app.post('/api/statements', (req, res) => {

    helpers.statement.analyze(req.body.text)
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

        // the breakdown is sent separately from the statement by the client
        // as there are some additional and some missing properties needed for the database
        for (let i = 0; i < analysis.breakdown.length; i++) {
          statement.breakdown.push({
            'position': i,
            'word': analysis.breakdown[i].word,
            'phrase': analysis.breakdown[i].phrase,
            'points': analysis.breakdown[i].points,
            'uses': analysis.breakdown[i].uses,
          });
        }

        statement.save().then((statement) => {
          return res.json(statement);
        });

      }).catch((err) => {
        console.error('error', err);
        return res.status(500).send(err); //@TODO determine HTTP status code to use
      });

  });

};

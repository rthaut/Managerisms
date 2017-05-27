const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BreakdownSchema = require('./breakdowns');
const RatingSchema = require('./ratings');

let StatementSchema = new Schema({
  'text': {
    'type': String,
    'required': true,
    'trim': true,
    'unique': true
  },
  'breakdown': [BreakdownSchema],
  'author': {
    'type': String,
    'required': false,
    'trim': true
  },
  'citation': {
    'type': String,
    'required': false,
    'trim': true
  },
  'created': {
    'type': Date,
    'default': Date.now,
    'required': true
  },
  'session_id': {
    'type': String,
    'required': true,
    'trim': true
  },
  'score': {
    'feedback': {
      'type': String,
      'required': true,
      'trim': true
    },
    'points': {
      'awarded': {
        'type': Number,
        'required': true
      },
      'unadjusted': {
        'type': Number,
        'required': true
      }
    }
  },
  'rating': {
    'average': {
      'type': Number,
      'default': 0,
      'required': false
    },
    'count': {
      'type': Number,
      'default': 0,
      'required': false
    },
    'ratings': [RatingSchema]
  }
});

StatementSchema.pre('save', function (next) {

  // console.log('statement pre-save');
  // console.log(this);
  // console.log('\n');

  // console.log('modifiedPaths');
  // console.log(this.modifiedPaths());
  // console.log('\n');

  // store the isNew flag for use after the save
  // (see: https://github.com/Automattic/mongoose/issues/1474)
  this.wasNew = this.isNew;

  if (this.isModified('rating.ratings')) {
    // calculate the statement's average rating after updating a statement

    if (this.rating.ratings.length) {
      this.rating.average = this.rating.ratings.reduce((acc, val) => acc + val.value, 0) / this.rating.ratings.length;
    } else {
      this.rating.average = 0;
    }
  }

  next();

});

StatementSchema.post('save', function (statement) {

  // console.log('statement post-save');
  // console.log(statement);
  // console.log('\n');

  // console.log('modifiedPaths');
  // console.log(statement.modifiedPaths());
  // console.log('\n');

  if (statement.wasNew) {
    // increment the uses counter of all used words and phrases immediately after creating a statement

    // get the used words and phrases from the breakdown as arrays of IDs
    const words = statement.breakdown.filter((val) => val.word !== undefined).map((val) => val.word);
    const phrases = statement.breakdown.filter((val) => val.phrase !== undefined).map((val) => val.phrase);

    // these are fired and forgotten, as it isn't *really* critical that they work...
    mongoose.model('Words').updateMany({ _id: { $in: words } }, { $inc: { 'uses': 1 } }).exec();
    mongoose.model('Phrases').updateMany({ _id: { $in: phrases } }, { $inc: { 'uses': 1 } }).exec();
  }

});

/*StatementSchema.pre('update', function (next) {

  // console.log('statement pre-update');
  // console.log(this);
  // console.log('\n');

  // console.log('this.getUpdate()');
  // console.log(this.getUpdate());
  // console.log('\n');

  next();

});*/

/*StatementSchema.post('update', function (err, statement, next) {

  // console.log('statement post-update');
  // if (err) {
  //   console.error('ERROR');
  //   console.error(err);
  // }
  // console.log(statement);
  // console.log('\n');

  next();

});*/

module.exports = StatementSchema;

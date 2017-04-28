const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classifications = require('../').classifications;

let BreakdownSchema = new Schema({
  'position': {
    'type': Number,
    'required': true
  },
  'word': {
    'type': Schema.Types.ObjectId,
    'ref': 'Words'  // MUST match name (and case) of string given to mongoose.model() [in /server/database/index.js]
  },
  'phrase': {
    'type': Schema.Types.ObjectId,
    'ref': 'Phrases'  // MUST match name (and case) of string given to mongoose.model() [in /server/database/index.js]
  },
  'points': {   // points awarded at time of statement creation
    'type': Number,
    'required': true
  },
  'uses': {   // word/phrase total uses at time of statement creation
    'type': Number,
    'default': 0,
    'required': true
  }
});

module.exports = BreakdownSchema;

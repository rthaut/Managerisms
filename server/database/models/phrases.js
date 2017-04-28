const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classifications = require('../').classifications;

let PhraseSchema = new Schema({
  'value': {
    'type': String,
    'required': true,
    'trim': true,
    'unique': true
  },
  'classification': {
    'type': [String],
    'enum': classifications,
    'required': true,
    'trim': true
  },
  'created': {
    'type': Date,
    'default': Date.now,
    'required': true
  },
  'points': {
    'type': Number,
    'required': true
  },
  'uses': {
    'type': Number,
    'default': 0,
    'required': true
  }
});

module.exports = PhraseSchema;

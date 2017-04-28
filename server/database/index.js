const mongoose = require('mongoose');

exports.classifications = [
  'adjective',
  'adverb',
  'article',
  'complex noun',
  'complex verb',
  'conjunction',
  'coordinating conjunction',
  'interjection',
  'noun',
  'possessive pronoun',
  'preposition',
  'prepositional phrase',
  'pronoun',
  'verb modifier',
  'verb'
];

exports.mapDictionaryClassifications = function (classifications) {
  for (let i = 0; i < classifications.length; i++) {
    switch (classifications[i]) {
      case 'phrasal verb':
        classifications.splice(i, 1, 'verb');
        break;
      case 'number':
        classifications.splice(i, 1, 'noun');
        break;
    }
  }

  return classifications;
};


const WordSchema = require('./models/words');
const PhraseSchema = require('./models/phrases');
const StatementSchema = require('./models/statements');

exports.words = mongoose.model('Words', WordSchema);
exports.phrases = mongoose.model('Phrases', PhraseSchema);
exports.statements = mongoose.model('Statements', StatementSchema);

const q = require('q');
const lemmatizer = require("lemmatizer");
const db = require('../../database');
const helpers = require('../');


/**
 * Gets all relevant data about a statement (breakdown, validation, syntax, score, etc.)
 * @param {String} statement
 * @return {Object}
 */
exports.analyze = function (text) {

  let statement = {};
  let _breakdown = [];

  // get the initial statement breakdown
  // this includes ALL words and phrases (BOTH valid and invalid), with ALL possible uses for each
  return getBreakdown(clean(text)).then((breakdown) => {

    return setBreakdownPoints(breakdown);

  }).then((breakdown) => {

    // store the breakdown for additional processing
    _breakdown = breakdown;

    // determine if the statement is valid
    return getValidation(_breakdown);

  }).then((validation) => {

    // set the validation results on the return object
    statement.validation = validation;

    if (validation.valid && validation.syntax != null) {
      _breakdown = setBreakdownSyntax(_breakdown, validation.syntax);
    }

    // remove the <> wrappers
    for (let i = 0; i < _breakdown.length; i++) {
      if (_breakdown[i].word && _breakdown[i].word.classification) {
        _breakdown[i].word.classification = _breakdown[i].word.classification.map((val) => val.replace(/[\<\>]/g, ''));
      } else if (_breakdown[i].phrase && _breakdown[i].phrase.classification) {
        _breakdown[i].phrase.classification = _breakdown[i].phrase.classification.map((val) => val.replace(/[\<\>]/g, ''));
      }
    }

    // create the formatted string using the breakdown
    statement.formatted = format(_breakdown);

    // set the breakdown on the return object
    statement.breakdown = _breakdown;

    // use the breakdown to compute a score
    return getScore(_breakdown);

  }).then((score) => {

    // set the score on the return object
    statement.score = score;

    // return the final object with all properties set
    return statement;

  });
};

/**
 * Cleans a statement before analysis
 * @param {String} statement
 * @returns {String}
 */
const clean = function (text) {

  return text
    // split hyphenated words
    .split('-').join(' ')

    // expand contractions
    .replace(/([\w]+)\'(ll)/g, '$1 will')
    .replace(/([\w]+)\'(d)/g, '$1 had')
    .replace(/([\w]+)\'(s)/g, '$1 is')
    .replace(/([\w]+)n\'(t)/g, '$1 not')

    // remove special characters
    .replace(/[\`\~\!\@\#\$\%\^\&\*\(\)\-\=\_\+\[\]\{\}\\\|\;\:\'\"\<\>\?\,\.\/]/g, '')

    // remove extraneous spaces
    .replace(/[\s]+/g, ' ')

    .trim()
    .toLowerCase();

};

/**
 * Gets the standardized, formatted version of a statement from the breakdown
 * @param {Array} breakdown
 * @returns {String}
 */
const format = function (breakdown) {

  let text = [];

  for (let i = 0; i < breakdown.length; i++) {
    if (breakdown[i].word && breakdown[i].word.value) {
      text.push(breakdown[i].word.value);
    } else if (breakdown[i].phrase && breakdown[i].phrase.value) {
      text.push(breakdown[i].phrase.value);
    }
  }

  text = text.join(' ');

  return (text.toLowerCase().charAt(0).toUpperCase() + text.toLowerCase().slice(1)).trim() + '.';

};

/**
 * Generates the breakdown for a statement
 * @param {String} statement
 * @returns {Array}
 */
const getBreakdown = function (text) {

  const words = text.split(' ');
  const unique = words.filter((val, idx, arr) => arr.indexOf(val) === idx);
  console.log('unique', unique);

  let breakdown = [];

  return q.all([
    db.words.find({ 'value': { '$in': unique } }).lean().exec(),
    db.phrases.find({}).lean().exec()
  ]).spread((dbWords, dbPhrases) => {

    return lookupWords(words, dbWords).then((newWords) => {

      // append the new words to the array that was first pulled from the DB
      Array.prototype.push.apply(dbWords, newWords);

      const dbWordValues = dbWords.map((val) => val.value);

      //@TODO instead of using this loop label, make a function that:
      //      1.) searches the words and phrases
      //      2.) returns the the proper object to push to the breakdown array (or NULL for no match)
      //      NOTE: it needs a way to increment i correctly (or i needs to be incremented based on the returned object)
      wordLoop:
      for (let i = 0; i < words.length; i++) {

        const remainingText = words.slice(i).join(' ');
        // console.log('\nremainingText', remainingText);

        for (let dbPhraseIdx = 0; dbPhraseIdx < dbPhrases.length; dbPhraseIdx++) {

          let phraseRegExp = RegExp('^' + dbPhrases[dbPhraseIdx].value.replace(/[\s\-]/g, '[\\s\\-]?'), 'g');
          // console.log('RegExp', phraseRegExp.toString());

          const result = phraseRegExp.exec(remainingText);
          if (result !== null) {
            // console.log('\tfound "' + result[0] + '" in "' + remainingText + '"');
            breakdown.push({
              'type': 'phrase',
              'valid': true,
              'phrase': dbPhrases[dbPhraseIdx]
            });

            // increment the outer loop counter by the amount of words matched by the RegExp
            i += (result[0].split(/[\s\-]+/).length - 1);

            continue wordLoop;
          }

        }

        const dbWordIdx = dbWordValues.indexOf(words[i]);
        if (dbWordIdx >= 0) {
          breakdown.push({
            'type': 'word',
            'valid': true,
            'word': dbWords[dbWordIdx]
          });
        } else {
          breakdown.push({
            'type': 'word',
            'valid': false,
            'word': { 'value': words[i] },
            'error': 'unknown word'
          });
        }

      }

      // ensure there are no back-to-back words or phrases
      // (for syntaxes where the same type of word CAN be used back-to-back, like adjectives)
      //@TODO adjectives and adverbs could technically be used twice... (ex: really, really brave)
      for (let i = 0; i < breakdown.length; i++) {
        if (i > 0) {
          if (breakdown[i].word && breakdown[i - 1].word && breakdown[i].word.value === breakdown[i - 1].word.value) {
            breakdown[i].valid = false;
            breakdown[i].error = 'duplicate word';
            breakdown[i].points = 0;
          } else if (breakdown[i].phrase && breakdown[i - 1].phrase && breakdown[i].phrase.value === breakdown[i - 1].phrase.value) {
            breakdown[i].valid = false;
            breakdown[i].error = 'duplicate phrase';
            breakdown[i].points = 0;
          }
        }
      }

      return breakdown;
    });


  });

};

/**
 * Uses Dictionary API to lookup words from statement that are not in DB and adds them (if possible)
 * @param {Array} statementWords
 * @param {Array} databaseWords
 * @returns {Array}
 */
const lookupWords = function (statementWords, databaseWords) {
  const dbWordValues = databaseWords.map((val) => val.value);
  const unknownWords = statementWords.filter((val) => dbWordValues.indexOf(val) === -1);
  console.warn('unknown words', unknownWords);

  if (!unknownWords.length) {
    return q.when([]);
  }

  return helpers.word.getPartsOfSpeechBatch(unknownWords).then((matches) => {

    let newWords = [];
    unknownWords.forEach((word) => {
      //let baseWord = helpers.word.getBaseWord(word);
      let baseWord = lemmatizer.lemmatizer(word);
      console.log(`the base word of "${word}" is: ${baseWord}`);

      let classification = [];

      if (matches[word] !== undefined) {
        console.log(`using dictionary results for original word "${word}"`)

        classification = matches[word];
      } else if (matches[baseWord] !== undefined) {
        console.log(`using dictionary results for base word "${baseWord}"`)

        classification = matches[baseWord];
      }

      if (classification.length) {
        // convert the dictionary API classifications to our classifications
        classification = db.mapDictionaryClassifications(classification);

        // remove any duplicate classifications (as a result of the mapping conversion)
        classification = classification.filter((val, idx, arr) => arr.indexOf(val) === idx);

        // ensure the final list contains only our supported classifications
        classification = classification.filter((val) => db.classifications.indexOf(val) !== -1);
      }

      if (classification.length) {
        newWords.push({
          'value': word,
          'classification': classification,
          //'created': Date.now,
          'points': word.length,
          //'uses': 0
        });
      }

    });

    if (!newWords.length) {
      return q.when([]);
    }

    return db.words.insertMany(newWords).then((words) => {
      return words;
    }).catch((err) => {
      console.error(err);
      return [];
    });

  });

};

/**
 * Validates a statement based on the breakdown
 * @param {Array} breakdown
 * @returns {Object}
 */
const getValidation = function (breakdown) {
  //@TODO build syntax array from breakdown
  //      generate all possible syntaxes (i.e. multi-dimensional array explode)
  //      determine which (if any) of the possible syntaxes are valid

  let validation = { 'valid': false, 'syntax': null };

  // ensure all words and phrases are valid
  const valid = breakdown.reduce((acc, val) => acc && val.valid, true);
  if (valid) {

    let classifications = [];
    for (let i = 0; i < breakdown.length; i++) {
      if (breakdown[i].word && breakdown[i].word.classification) {
        classifications.push(breakdown[i].word.classification);
      } else if (breakdown[i].phrase && breakdown[i].phrase.classification) {
        classifications.push(breakdown[i].phrase.classification);
      }
    }

    let validSyntax = helpers.syntax.validate(classifications);
    if (validSyntax != null) {
      validation = { 'valid': true, 'syntax': validSyntax }
    }
  }

  return q.when(validation);

};

/**
 * Sets the classification of each used word/phrase in the breakdown to just the classification used by the syntax
 * @param {Array} breakdown
 * @returns {Array}
 */
const setBreakdownSyntax = function (breakdown, syntax) {

  for (let i = 0; i < breakdown.length; i++) {
    if (breakdown[i].word && breakdown[i].word.classification) {
      breakdown[i].word.classification = breakdown[i].word.classification.filter((val) => val === syntax[i]);
    } else if (breakdown[i].phrase && breakdown[i].phrase.classification) {
      breakdown[i].phrase.classification = breakdown[i].phrase.classification.filter((val) => val === syntax[i]);
    }
  }

  return breakdown;

};

/**
 * Sets the awarded points and current uses for each word/phrase in the breakdown based on the total usage
 * @param {Array} breakdown
 * @returns {Array}
 */
const setBreakdownPoints = function (breakdown) {

  return q.all([
    db.words.aggregate({ $group: { _id: null, total: { $sum: '$uses' } } }).exec(),
    db.phrases.aggregate({ $group: { _id: null, total: { $sum: '$uses' } } }).exec()
  ]).spread((wordTotal, phraseTotal) => {
    const totalWordUses = wordTotal[0].total;
    const totalPhraseUses = phraseTotal[0].total;

    let points, uses;
    for (let i = 0; i < breakdown.length; i++) {
      points = 0, uses = 0;

      if (breakdown[i].word) {

        if (breakdown[i].word.points) {
          points = breakdown[i].word.points;
          if (totalWordUses > 0) {
            points *= (1 - (breakdown[i].word.uses / totalWordUses));
          }
        }

        if (breakdown[i].word.uses) {
          uses = breakdown[i].word.uses;
        }

      } else if (breakdown[i].phrase) {

        if (breakdown[i].phrase.points) {
          points = breakdown[i].phrase.points;
          if (totalPhraseUses > 0) {
            points *= (1 - (breakdown[i].phrase.uses / totalPhraseUses));
          }
        }

        if (breakdown[i].phrase.uses) {
          uses = breakdown[i].phrase.uses;
        }

      }

      breakdown[i].points = Math.floor(points);
      breakdown[i].uses = uses;
    }

    return breakdown;

  });

};

/**
 * Returns the total score and feedback for a statement based on the breakdown
 * @param {Array} breakdown
 * @returns {Object}
 */
const getScore = function (breakdown) {

  const awarded = breakdown.reduce((acc, val) => acc + val.points, 0);

  let unadjusted = 0;
  unadjusted += breakdown.filter((val) => val.word !== undefined).reduce((acc, val) => acc + val.word.points, 0);
  unadjusted += breakdown.filter((val) => val.phrase !== undefined).reduce((acc, val) => acc + val.phrase.points, 0);

  let feedback = getFeedback(awarded);

  return q.when({ 'points': { 'awarded': awarded, 'unadjusted': unadjusted }, 'feedback': feedback });

};

/**
 * Returns textual feedback based on points
 * @param {Integer} points
 * @returns {String}
 */
const getFeedback = function (points) {

  //@TODO store these in the database?
  var feedbacks = [
    { 'points': 500, 'feedback': 'High Score? Probably. Actual statement uttered by a real person? Doubtful.' },

    { 'points': 300, 'feedback': 'You\'ve peaked. Game over. Go schedule some 1:1 meetings.' },
    { 'points': 275, 'feedback': '🔥🔥🔥 (It doesn\'t really get any better than this.)' },
    { 'points': 250, 'feedback': 'Shareholders swoon at the sight of you.' },
    { 'points': 225, 'feedback': 'That\'s some executive-level word manipulation right there.' },
    { 'points': 200, 'feedback': 'English is your bitch. Congratulations!' },
    { 'points': 175, 'feedback': 'OK, you\'re an *experienced* manager/salesperson.' },
    { 'points': 150, 'feedback': 'You must be a manager. Or a salesperson.' },
    { 'points': 125, 'feedback': 'Scott Adams would be proud (or mortified... probably mortified).' },
    { 'points': 100, 'feedback': 'I can tell a seasoned veteran by the way (s)he talks.' },
    { 'points': 075, 'feedback': 'Now you\'re getting the hang of it.' },
    { 'points': 050, 'feedback': 'Interns accidentally say things like this on their weekends.' },
    { 'points': 025, 'feedback': 'You\'ve seen a buzzword or two in your days...' },
    { 'points': 000, 'feedback': 'You must be new around here...' }
  ];

  for (let i = 0; i < feedbacks.length; i++) {
    console.log(points + ' >= ' + feedbacks[i].points, points >= feedbacks[i].points);
    if (points >= feedbacks[i].points) {
      return feedbacks[i].feedback;
    }
  }

};

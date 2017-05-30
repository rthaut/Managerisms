require('./array');

exports.validate = validate = function (classifications) {

  const validSyntaxes = getValidSyntaxes();

  const variations = getAllCombinations(classifications);

  for (let i = 0; i < validSyntaxes.length; i++) {

    for (let j = 0; j < variations.length; j++) {

      if (RegExp('^' + validSyntaxes[i] + '$').test(variations[j].join(''))) {
        return variations[j];
      }

    }

  }

  return null;

};

/**
 * @param {Array} classifications
 * @return {Array}
 */
exports.getAllCombinations = getAllCombinations = function (classifications) {

  for (let i = 0; i < classifications.length; i++) {

    // wrap all classifications in angle brackets
    for (let j = 0; j < classifications[i].length; j++) {
      if (classifications[i][j].indexOf('<') === -1 && classifications[i][j].indexOf('>') === -1) {
        classifications[i][j] = '<' + classifications[i][j] + '>';
      }
    }

  }

  variations = classifications.implodeNested(classifications);
  return variations;

};

exports.getValidSyntaxes = getValidSyntaxes = function () {

  // NOUNS
  let nouns = [
    `<noun>`,
    `<pronoun>`,
    `<complex noun>`
  ];
  nouns = `(?:` + nouns.join('|') + `)`;

  let noun_modifiers = [
    //`<noun modifier>`,   // doesn't exist yet...
    `(?:<article>|<possessive pronoun>)?(?:(?:<adverb>)*<adjective>)*`
  ];
  noun_modifiers = `(?:` + noun_modifiers.join('|') + `)`;

  let complex_nouns = [
    `${noun_modifiers}?${nouns}`
  ];
  complex_nouns = `(?:` + complex_nouns.join('|') + `)`;
  complex_nouns = `${complex_nouns}(?:<coordinating conjunction>${complex_nouns})*`;

  // VERBS
  let verbs = [
    `<verb>`,
    `<complex verb>`
  ];
  verbs = `(?:` + verbs.join('|') + `)`;

  let verb_modifiers = [
    `<verb modifier>`,
    `<adverb>`
  ];
  verb_modifiers = `(?:` + verb_modifiers.join('|') + `)`;

  let complex_verbs = [
    `${verb_modifiers}*${verbs}`
  ];
  complex_verbs = `(?:` + complex_verbs.join('|') + `)`;


  // PREPOSITIONAL PHRASES
  let prepositional_phrases = [
    `<prepositional phrase>`,
    `<preposition>${complex_nouns}`
  ];
  prepositional_phrases = `(?:` + prepositional_phrases.join('|') + `)`;


  // COMPLETE STRUCTURES
  let statement = `${prepositional_phrases}*${complex_nouns}${prepositional_phrases}*${complex_verbs}${prepositional_phrases}*(?:${complex_nouns}|${noun_modifiers})?${prepositional_phrases}*`;

  return [
    `${statement}(?:<conjunction>${statement})*`
  ];

};

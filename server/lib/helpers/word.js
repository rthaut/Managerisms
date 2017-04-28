const helpers = require('../');
const q = require('q');

exports.getPartsOfSpeechBatch = getPartsOfSpeechBatch = function (words, offset, limit) {

  let promises = [];

  for (let i = 0; i < words.length; i++) {
    promises.push(getPartsOfSpeech(words[i], offset, limit));
  }

  return q.all(promises).then((results) => {
    let matches = {};

    results.forEach((result) => {
      Object.assign(matches, result);
    });

    console.log('getPartsOfSpeechBatch() : results', results);

    return matches;
  }).catch((err) => {
    console.error(err);
    return null;
  })

};

exports.getPartsOfSpeech = getPartsOfSpeech = function (word, offset, limit) {
  let results = {};

  return getDictionaryData(word, offset, limit).then((data) => {

    if (data.total && data.results.length) {
      data.results.forEach((result) => {
        if ((result.part_of_speech !== undefined) && /^\w+$/.test(result.headword)) {

          if (!results[result.headword]) {
            results[result.headword] = [];
          }
          results[result.headword].push(result.part_of_speech);

        }
      });
    }

    console.log('getPartsOfSpeech() :: return', results);
    return results;

  }).catch((err) => {
    console.error(err);
    return results;
  });
};

exports.getDictionaryData = getDictionaryData = function (word, offset, limit) {
  const API_VERSION = 2;
  const DICTIONARY = 'laad3';

  offset = offset || 0;
  limit = limit || 25;

  let options = {
    'hostname': 'api.pearson.com',
    'port': 80,
    'path': `/v${API_VERSION}/dictionaries/${DICTIONARY}/entries?headword=${word}&offset=${offset}&limit=${limit}`,
    'headers': {
      'Accept': 'application/json'
    }
  };

  return helpers.http.getDeferredJSON(options);
};

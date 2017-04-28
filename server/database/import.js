const fs = require('fs');
const csv = require('csv');
const db = require('./');

module.exports = function () {

  db.words.count({}, (err, count) => {
    if (count == 0) {
      console.warn('There are ' + count + ' words in database; attempting to import data from file');
      loadData(db.words, 'words');
    }
  });

  db.phrases.count({}, (err, count) => {
    if (count == 0) {
      console.warn('There are ' + count + ' phrases in database; attempting to import data from file');
      loadData(db.phrases, 'phrases');
    }
  });
}

const loadData = (model, type) => {

  let data = [];

  if (fs.existsSync(__dirname + '/data/' + type + '.json')) {
    console.log('Loading ' + type + ' data from JSON file');
    data = JSON.parse(fs.readFileSync(__dirname + '/data/' + type + '.json', 'utf8'));
    importData(model, data, type);
  } else if (fs.existsSync(__dirname + '/data/' + type + '.csv')) {
    console.log('Loading ' + type + ' data from CSV file');
    const parser = csv.parse({ delimiter: ',', escape: '"' });

    parser.on('readable', function () {
      while (record = parser.read()) {
        data.push({
          'value': record[0],
          'classification': record[1].split(','),
          //'created': Date.now,
          'points': ((type === 'words') ? record[0].length : (record[0].length * record[0].split(' ').length)),
          //'uses': 0
        });
      }
    });

    parser.on('error', (err) => {
      console.error(err.message);
    });

    parser.on('finish', function () {
      console.log('Using ' + type + ' data from CSV file');
      importData(model, data, type);
    });

    fs.createReadStream(__dirname + '/data/' + type + '.csv').pipe(parser);
  } else {
    console.error('ERROR: There are no ' + type + ' files to use for database import');
  }
}

const importData = (Model, data, type) => {
  console.log('Importing ' + data.length + ' ' + type + ' into database...');

  Model.insertMany(data)
    .then((docs) => {
      console.log('\t' + 'Finished importing ' + docs.length + ' of ' + data.length + ' ' + type + ' into database...');

      //console.log('Writing ' + type + ' data from CSV file to new JSON file (for future use)');
      //fs.writeFileSync(__dirname + '/data/' + type + '.json', JSON.stringify(data), 'utf8');

      console.log('\n');
      return true;
    })
    .catch((err) => {
      if (err) {
        console.error(err);
        return false;
      }
    });

};



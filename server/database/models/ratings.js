const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let RatingSchema = new Schema({
  'value': {
    'type': Number,
    'default': 0,
    'required': true
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
  }
});

/*RatingSchema.pre('save', function (next) {

  // console.log('rating pre-save');
  // console.log(this);
  // console.log('\n');

  // console.log('modifiedPaths');
  // console.log(this.modifiedPaths());
  // console.log('\n');

  next();

});*/

/*RatingSchema.post('save', function (rating) {

  // console.log('rating post-save');
  // console.log(rating);
  // console.log('\n');

});*/

/*RatingSchema.pre('update', function (next) {

  // console.log('rating pre-update');
  // console.log(this);
  // console.log('\n');

  // console.log('this.getUpdate()');
  // console.log(this.getUpdate());
  // console.log('\n');

  next();

});*/

/*RatingSchema.post('update', function (err, rating, next) {

  // console.log('rating post-update');
  // if (err) {
  //   console.error('ERROR');
  //   console.error(err);
  // }
  // console.log(rating);
  // console.log('\n');

  next();

});*/

module.exports = RatingSchema;

var util = require('./lib/utility.js');
var mongoose = require('mongoose');
var crypto = require('crypto');

mongoose.connect('mongodb://localhost/shortly');

var Schema = mongoose.Schema;

var linkSchema = new Schema({
  url: String,
  visits: Number,
  code: String,
  title: String
});

linkSchema.pre('save', function(next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);

  util.getUrlTitle(this.url, (err, title) => {
    this.title = title;
    next();
  });
  
});

var userSchema = new Schema({
  username: String,
  password: String
});

exports.User = mongoose.model('User', userSchema);
exports.Link = mongoose.model('Link', linkSchema);
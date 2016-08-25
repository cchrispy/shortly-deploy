var util = require('./lib/utility.js');
var mongoose = require('mongoose');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');

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

userSchema.pre('save', function(next) {
  bcrypt.hash(this.password, null, null, (err, hash) => {
    this.password = hash;
    next();
  });
});

userSchema.statics.authUser = function(name, password, cb) {
  this.findOne({ username: name }, (err, user) => {
    if (user) {
      bcrypt.compare(password, user.password, (err, result) =>
        cb(result ? user : undefined));
    } else {
      cb();
    }
  });
};

exports.User = mongoose.model('User', userSchema);
exports.Link = mongoose.model('Link', linkSchema);
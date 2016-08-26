var util = require('./lib/utility.js');
var mongoose = require('mongoose');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');

mongoose.connect('mongodb://localhost/shortly');

var Schema = mongoose.Schema;

var linkSchema = new Schema({
  url: { type: String, validate: util.isValidUrl},
  visits: { type: Number, default: 0 },
  code: String,
  title: String
});

linkSchema.pre('save', function(next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);

  util.getUrlTitle(this.url, (err, title) => {
    this.title = title;
    next(err);
  });
});

linkSchema.statics.getOrCreate = function(url) {
  if (!url.match(/:\/\//)) {
    url = 'http://' + url;
  }
  return new Promise((resolve, reject) => {
    this.findOne({ url: url}, (err, link) => {
      if (link) {
        resolve(link);
      } else {
        new exports.Link({url: url})
          .save()
          .then(resolve)
          .catch(reject);
      }
    });
  });
};

var userSchema = new Schema({
  username: String,
  password: String,
  links: { type: [Schema.ObjectId], default: [] }
});

userSchema.pre('save', function(next) {
  if (this.isNew) {
    bcrypt.hash(this.password, null, null, (err, hash) => {
      this.password = hash;
      next(err);
    });
  } else {
    next();
  }
});

userSchema.statics.authUser = function(name, password) {
  return new Promise((resolve, reject) => {
    this.findOne({ username: name }, (err, user) => {
      if (user) {
        bcrypt.compare(password, user.password, (err, match) => {
          if (match) {
            resolve(user);
          } else {
            reject('incorrect credentials');
          }
        });
      } else {
        reject('incorrect credentials');
      }
    });
  });
};

userSchema.statics.exists = function(name, cb) {
  this.findOne({ username: name }, (err, user) => cb(user)); 
};

userSchema.statics.newUser = function(name, password) {
  return new Promise((resolve, reject) => {
    this.exists(name, user => {
      if (!user) {
        resolve(new exports.User({
          username: name,
          password: password
        }).save());
      } else {
        reject('user already exists');
      }
    });
  });
};

exports.User = mongoose.model('User', userSchema);
exports.Link = mongoose.model('Link', linkSchema);
var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../db.js');
var User = db.User;
var Link = db.Link;

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find().exec((err, links) => {
    res.status(200).send(links);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  var link = Link.find({url: uri});
  link.exec(function(err, found) {
    if (err) {
    } else {
      if (!found.length) {
        var newLink = new Link({url: uri }).save().then((createdLink) => {
          res.send(createdLink);
        });
      } else {
        res.send(found[0]);
      }
    }
  });
};

exports.loginUser = function(req, res) {
  User.authUser(req.body.username, req.body.password, user => {
    if (user) {
      util.createSession(req, res, user);
    } else {
      res.redirect('/login');
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var user = User.find({username: username});
  user.exec(function(err, name) {
    if (err) {
      console.log('error', err);
    } else {
      if (!name.length) {
        var newUser = new User({username: username, password: password}).save();
        util.createSession(req, res, newUser);
      } else {
        console.log('user exists!');
        res.redirect('/signup');
      }
    }
  });
};

exports.navToLink = function(req, res) {
  Link.find({ code: req.params[0] }).exec((err, links) => {
    console.log('LINKS: ', links);
    if (links.length) {
      res.redirect(links[0].url);
    } else {
      res.status(404).send('not found...');
    }
  });
};
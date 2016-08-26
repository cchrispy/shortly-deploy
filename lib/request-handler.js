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
  User.findOne({ username: req.session.user }).then(user => {
    console.log('A', user.links);
    Link.find().where('_id').in(user.links).then(links => {
      console.log('B', links);
      res.status(200).send(links);
    }).catch((err) => {
      console.log('ERROR');
    });
  });
};

exports.saveLink = function(req, res) {
  Link.getOrCreate(req.body.url).then(link => {
    User.findOne({ username: req.session.user }).then(user => {
      user.links.push(link);
      user.save();
    });
    res.send(link);
  }).catch(err => {
    res.sendStatus(404);
  });
};

exports.loginUser = function(req, res) {
  User.authUser(req.body.username, req.body.password).then(user => {
    util.createSession(req, res, user);
  }).catch((err) => {
    res.redirect('/login');
  });
};

exports.signupUser = function(req, res) {
  User.newUser(req.body.username, req.body.password).then(user => {
    util.createSession(req, res, user);
  }).catch(err => {
    res.redirect('/signup');
  });
};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] }).then(link => {
    console.log('LINKS: ', link);
    if (link) {
      link.update({ $inc: { visits: 1 } }).exec();
      res.redirect(link.url);
    } else {
      res.status(404).send('not found...');
    }
  });
};
var express = require('express');var app = express();var user = require('./models/user.js');var messages = require('./models/messages.js');app.use(express.bodyParser());app.use(express.cookieParser());app.use(express.session({secret: 'fakesecret'}));app.use(express.query());app.use(express.csrf());app.use(express.static(__dirname + '/public'));app.configure(function() {    app.use(function(req, res, next) {        res.locals.token = req.csrfToken();        next();    });});app.set('view engine', 'jade');app.get('/register', function(req, res) {    res.render('register');});app.post('/register', function(req, res) {    var username = req.body.username;    var password = req.body.password;    user.newUser(username, password, false)    .then(function() {        res.redirect('/register');    });});app.get('/login', function(req, res) {    res.render('login');})app.post('/login', function(req, res) {    var username = req.body.username;    var password = req.body.password;    user.authenticateUser(username, password)    .then(function(id) {        if(id) {            req.session.userID = id;            res.redirect('/page/1');        } else {            res.redirect('/login');        }    })    .fail(function(err) {        console.log(err);        res.redirect('/register');    })});app.get('/logout', function(req, res) {    req.session.destroy();    res.redirect('/login');})app.get('/newtopic', function(req, res) {    if (typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        res.render('newTopic');    }});app.post('/newtopic', function(req, res) {    if (typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        var userID = req.session.userID;        var title = req.body.title;        var message = req.body.message;        messages.newTopic(userID, title, message)        .then(function(topicID) {            res.redirect('/topic/' + topicID);        })        .fail(function(err) {            console.log(err);            res.redirect('/register');        });    }});app.get('/page/:page', function(req, res) {    if (typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        messages.getPage(req.params.page)        .then(function(topics) {            res.render('topic_list', { topics: topics });        })        .fail(function(err) {            console.log(err);        });    }});app.get('/topic/:id', function(req, res) {    if (typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        messages.getTopic(req.params.id)        .then(function(topicContents) {            res.render('topic', { topicContents: topicContents });        })        .fail(function(err) {            console.log(err);        });    }});app.get('/reply/:id', function(req, res) {    if (typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        res.render('reply');    }});app.post('/reply/:id', function(req, res) {    if (typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        var userID = req.session.userID;        var topicID = req.params.id;        var message = req.body.message;        messages.newReply(userID, message, topicID)        .then(function() {            res.redirect('/topic/' + topicID);        })        .fail(function(err) {            console.log(err);        });    }});app.listen(8000);
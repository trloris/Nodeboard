var express = require('express');var app = express();var bodyParser = require('body-parser');var cookieParser = require('cookie-parser');var session = require('express-session');var csrf = require('csurf');var user = require('./models/user.js');var messages = require('./models/messages.js');var Q = require('Q');var csrfWhiteList = /\/newreplies\/topic\/[0-9]+\/reply\/[0-9]+/g;var registrationWhiteList = [/\/register/g, /\/login/g, /\/css\/.+/g, /\/logout/g];var csrfException = function(url) {    if (url.match(csrfWhiteList)) {        return true;    } else {        return false;    }}var registrationException = function(url) {    for (var i = 0; i<registrationWhiteList.length; i++) {        if(url.match(registrationWhiteList[i])) {            return true;        }    }    return false;}var conditionalCSRF = function(req, res, next) {    if (csrfException(req.url)) {        next();    } else {        csrf()(req, res, next);    }}var checkLogin = function(req, res, next) {    if (!registrationException(req.url) && typeof req.session.userID === 'undefined') {        res.redirect('/login');    } else {        next();    }}app.use(bodyParser());app.use(cookieParser());app.use(session({secret: 'fakesecret'}));app.use(express.query());app.use(conditionalCSRF);app.use(checkLogin);app.use(express.static(__dirname + '/public'));app.use(function(req, res, next) {        if (!csrfException(req.url)) {            res.locals.token = req.csrfToken();        }        next();    });app.set('view engine', 'jade');app.get('/register', function(req, res) {    res.render('register');});app.post('/register', function(req, res) {    var username = req.body.username;    var password = req.body.password;    user.newUser(username, password, false)    .then(function() {        res.redirect('/register');    });});app.get('/login', function(req, res) {    res.render('login');})app.post('/login', function(req, res) {    var username = req.body.username;    var password = req.body.password;    user.authenticateUser(username, password)    .then(function(id) {        if(id) {            req.session.userID = id;            res.redirect('/page/1');        } else {            res.redirect('/login');        }    })    .fail(function(err) {        console.log(err);        res.redirect('/register');    })});app.get('/logout', function(req, res) {    req.session.destroy();    res.redirect('/login');})app.get('/newtopic', function(req, res) {    res.render('newTopic');});app.post('/newtopic', function(req, res) {    var userID = req.session.userID;    var title = req.body.title;    var message = req.body.message;    messages.newTopic(userID, title, message)    .then(function(topicID) {        res.redirect('/topic/' + topicID);    })    .fail(function(err) {        console.log(err);        res.redirect('/register');    });});app.get('/page/:page', function(req, res) {    messages.getPage(req.params.page)    .then(function(topics) {        res.render('topic_list', { topics: topics });    })    .fail(function(err) {        console.log(err);    });});app.get('/topic/:id', function(req, res) {    messages.getTopic(req.params.id)    .then(function(topicContents) {        var maxReply = 0;        for (var i = 0; i < topicContents.messages.length; i++) {            if (topicContents.messages[i].id > maxReply) {                maxReply = topicContents.messages[i].id;            }        }        res.render('topic', { topicContents: topicContents, maxReply: maxReply });    })    .fail(function(err) {        console.log(err);    });});app.get('/reply/:id', function(req, res) {    res.render('reply');});app.post('/reply/:id', function(req, res) {    var userID = req.session.userID;    var topicID = req.params.id;    var message = req.body.message;    messages.newReply(userID, message, topicID)    .then(function(reply) {        newReply(reply);        res.redirect('/topic/' + topicID);    })    .fail(function(err) {        console.log(err);    });});//Respond to all held requests with new replies. This is really dirty.var newReply = function(reply) {    while(heldResponses[reply.topic].length > 0) {        var resDetails = heldResponses[reply.topic].shift();        var resCallBack = function(res, callback) {            callback(null, res);        };        var resToPromise = Q.denodeify(resCallBack);        Q.all([resToPromise(resDetails), messages.getNewReplies(resDetails.topicID, resDetails.replyID)])        .spread(function(res, replies) {            res.res.send(replies);        });    }};var heldResponses = {};app.get('/newreplies/topic/:topic/reply/:reply', function(req, res) {    var topicID = req.params.topic;    var replyID = req.params.reply;    var resDetails = { topicID: topicID, replyID: replyID, res: res, sessionID: req.sessionID };    if(topicID in heldResponses) {        heldResponses[topicID].push(resDetails);    } else {        heldResponses[topicID] = [resDetails];    }    // Time out after 60 seconds.    setTimeout(function() {        res.send(408);    }, 60000);});app.listen(8000);
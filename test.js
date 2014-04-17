var express = require('express');
var app = express();

var heldResponses = {};

app.get('/:topic', function(req, res) {
    var topicID = req.params.topic;
    if(topicID in heldResponses) {
        console.log('using an old entry');
        heldResponses[topicID].push(res);
    } else {
        console.log('making new entry');
        heldResponses[topicID] = [res];
    }

    setTimeout(function() {
        res.send(408);
    }, 60000);
});

app.get('/done/:topic', function(req, res) {
    var topicID = req.params.topic;
    while (typeof heldResponses[topicID] !== "undefined" && heldResponses[topicID].length > 0) {
        var response = heldResponses[topicID].shift();
        response.send('hi');
    }
});

app.listen(8000);
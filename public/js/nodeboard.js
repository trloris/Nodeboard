var getReplies = function(topicID, replyID) {
    var req = new XMLHttpRequest();
    req.open("POST", "/newreplies/topic/" + topicID + "/reply/" + replyID);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function() {
        var response = JSON.parse(req.response);
        if (typeof response.length === 'undefined') {
            getReplies(topicID, replyID);
        } else {
            var lastReply = response[response.length - 1].id;
            var messageHeader = document.createElement('div');
            getReplies(topicID, lastReply);
        }
    }
    req.send();
}
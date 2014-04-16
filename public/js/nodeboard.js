var getReplies = function(topicID, replyID, token) {
    var req = new XMLHttpRequest();
    req.open("POST", "/newreplies/topic/" + topicID + "/reply/" + replyID);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function() {
        var response = JSON.parse(req.response);
        if (typeof response.length === 'undefined') {
            getReplies(topicID, replyID, token);
        } else {
            var lastReply = response[response.length - 1].id;
            var messageHeader = document.createElement('div');
            messageHeader.innerHTML = 'Fuck';

            getReplies(topicID, lastReply, token);
        }
    }
    req.send("_csrf=" + token);
}
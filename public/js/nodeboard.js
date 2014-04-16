var getReplies = function(topicID, replyID) {
    var req = new XMLHttpRequest();
    req.open("POST", "/newreplies/topic/" + topicID + "/reply/" + replyID);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function() {
        if (req.status == 408) {
            getReplies(topicID, replyID);
        } else {
            var response = JSON.parse(req.response);
            var lastReply = response[response.length - 1].id;
            for (var i = 0; i < response.length; i++) {
                var messageHeader = document.createElement('div');
                messageHeader.className = 'message-header';
                messageHeader.innerHTML = "From: " + response[i].username + " | Posted: " + response[i].createTime;
                var message = document.createElement('div');
                message.className = 'message';
                message.innerHTML = response[i].message;
                document.getElementsByClassName('messages')[0].appendChild(messageHeader);
                document.getElementsByClassName('messages')[0].appendChild(message);
            }
            getReplies(topicID, lastReply);
        }
    }
    req.send();
}
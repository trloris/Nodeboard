var pg = require('pg');
var conString = 'postgres://localhost/nodeboard';
var Q = require('Q');
var db = require('./database');

// Format time with leading 0 in hours/minutes
var timeFormat = function(num) {
	if (num < 10) {
		return "0" + num;
	} else {
		return num + "";
	}
};

// Format date to readable format
var dateFormat = function(d) {
	var formattedDate = d.getMonth() + '/' + d.getDate() + '/' + d.getFullYear();
	formattedDate    += ' ' + timeFormat(d.getHours()) + ':' + timeFormat(d.getMinutes());

	return formattedDate;
};

var newReply = function(user, message, topic) {
	var sql = 'INSERT INTO replies (username, message, topic) ';
	sql    += 'VALUES ($1, $2, $3)';
	var promise = db.sql(sql, [user, message, topic])
	.then(function(results) {
		var sql = 'UPDATE topics ';
		sql    += 'SET last_post_time=now() ';
		sql    += 'WHERE id=$1';

		db.sql(sql, [topic]);

		return { topic: topic };
	});

	return promise;
};

exports.newReply = newReply;

exports.newTopic = function(user, title, message) {
	var sql = 'INSERT INTO topics (title, username) ';
	sql    += 'VALUES ($1, $2) RETURNING id';

	var promise = db.sql(sql, [title, user])
	.then(function(results) {
		newReply(user, message, results.rows[0].id);

		return results.rows[0].id;
	});

	return promise;
};

exports.getPage = function(page) {

	var offset = 50 * (page - 1);

	var sql = 'SELECT topics.id, title, users.username, last_post_time, COUNT(*) As reply_count ';
	sql    += 'FROM topics INNER JOIN users ON users.id = topics.username ';
	sql    += 'INNER JOIN replies ON topics.id=replies.topic ';
	sql	   += 'GROUP BY topics.id, title, users.username, last_post_time ';
	sql    += 'ORDER BY last_post_time DESC LIMIT 50 OFFSET $1';

	var promise = db.sql(sql, [offset])
	.then(function(results) {
		var topics = [];
		for (var i = 0; i < results.rows.length; i++) {
			var d = new Date(results.rows[i].last_post_time);

			topics.push({ id: results.rows[i].id,
						  title: results.rows[i].title,
			              username: results.rows[i].username,
			              count: results.rows[i].reply_count,
			              lastPostTime: dateFormat(d) });
		}

		return topics;
	});
	return promise;
};

exports.getTopic = function(id) {
	var sql = 'SELECT users.username, title, message, create_time, replies.id ';
	sql    += 'FROM topics INNER JOIN replies ON topics.id=replies.topic ';
	sql    += 'INNER JOIN users ON users.id=replies.username ';
	sql    += 'WHERE topics.id=$1 ';
	sql    += 'ORDER BY replies.id ASC';

	var promise = db.sql(sql, [id])
	.then(function(results) {
		var topicContents = { id: id, title: results.rows[0].title, messages: [] };
		for (var i = 0; i < results.rows.length; i++) {
			var d = new Date(results.rows[i].create_time);
			topicContents.messages.push({ id: results.rows[i].id,
										  message: results.rows[i].message,
							    		  username: results.rows[i].username,
							    		  createTime: dateFormat(d) });
		}

		return topicContents;
	});

	return promise;
};

exports.getNewReplies = function(topicID, replyID) {
	var sql = 'SELECT users.username, message, create_time, replies.id ';
	sql    += 'FROM replies INNER JOIN users on replies.username=users.id ';
	sql    += 'WHERE topic=$1 AND replies.id>$2';

	var promise = db.sql(sql, [topicID, replyID])
	.then(function(results) {
		var replies = [];
		for (var i = 0; i < results.rows.length; i++) {
			var d = new Date(results.rows[i].create_time);

			replies.push({ id: results.rows[i].id,
						   username: results.rows[i].username,
						   message: results.rows[i].message,
						   createTime: dateFormat(d) });
		}

		return replies;
	});

	return promise;
};
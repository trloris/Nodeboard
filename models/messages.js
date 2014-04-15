var pg = require('pg');
var conString = 'postgres://localhost/nodeboard';
var Q = require('Q');
var db = require('./database');

var newReply = function(user, message, topic) {
	var sql = 'INSERT INTO replies (username, message, topic) ';
	sql    += 'VALUES ($1, $2, $3)';
	var promise = db.sql(sql, [user, message, topic])
	.then(function() {
		var sql = 'UPDATE topics ';
		sql    += 'SET last_post_time=now() ';
		sql    += 'WHERE id=$1';

		db.sql(sql, [topic]);
	});

	return promise;
}

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
}

exports.getPage = function(page) {
	var timeFormat = function(num) {
		if (num < 10) {
			return "0" + num;
		} else {
			return num + "";
		}
	};

	var offset = 50 * (page - 1);
	var sql = 'SELECT topics.id, title, users.username, last_post_time '
	sql    += 'FROM topics INNER JOIN users ON users.id = topics.username '
	sql    += 'ORDER BY last_post_time DESC LIMIT 50 OFFSET $1';
	
	var promise = db.sql(sql, [offset])
	.then(function(results) {
		var topics = [];
		for (var i = 0; i < results.rows.length; i++) {
			var d = new Date(results.rows[i].last_post_time);
			var formattedDate = d.getMonth() + '/' + d.getDate() + '/' + d.getFullYear();
			formattedDate    += ' ' + timeFormat(d.getHours()) + ':' + timeFormat(d.getMinutes());

			topics.push({ id: results.rows[i].id,
						  title: results.rows[i].title,
			              username: results.rows[i].username,
			              lastPostTime: formattedDate });
		}

		return topics;
	});
	return promise;
}

exports.getTopic = function(id) {
	var sql = 'SELECT replies.username, title, message, create_time ';
	sql    += 'FROM topics INNER JOIN replies ON topics.id=replies.topic ';
	sql    += 'INNER JOIN users ON users.id=replies.username ';
	sql    += 'WHERE topics.id=$1 ';
	sql    += 'ORDER BY replies.id ASC';

	var promise = db.sql(sql, [id])
	.then(function(results) {
		console.log(results);
		var topicContents = { title: results.rows[0].title, messages: [] };
		for (var i = 0; i < results.rows.length; i++) {
			topicContents.messages.push({ message: results.rows[i].message,
							      username: results.rows[i].username,
							      createTime: results.rows[i].create_time });
		}

		return topicContents;
	});

	return promise;
}
var pg = require('pg');
var conString = 'postgres://localhost/nodeboard';
var Q = require('Q');
var db = require('./database');

// var runSql2 = function(sql, parameters) {
// 	pg.connect(conString, function (err, client, done)
// }

// var connect = function (conString) {
// 	return Q.ninvoke(pg, connect);
// };

// var query = function (sql, client, parameters) {
// 	return Q.ninvoke(client, sql, parameters);
// };

// exports.getTopic = function(id) {
// 	var sql =  'SELECT * FROM topics ';
// 	sql += 'INNER JOIN replies ON topics.id=replies.topic ';
// 	sql += 'WHERE topics.id=$1';
// 	var promise = Q.nfcall(runSql, sql, [id])
// 	.then(function(result) {
// 		var topic = { id: result.rows[0].topic, title: result.rows[0].title, messages: [] };
// 		for (var i = 0; i < result.rows.length; i++) {
// 			topic.messages.push({ id: result.rows[i].id, message: result.rows[i].message });
// 		}

// 		return topic;
// 	});

// 	return promise;
// }

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
	// .then(function(results) {
	// 	var id = results.rows[0].id;
	// 	var sql = 'INSERT INTO replies (topic, message, username) ';
	// 	sql    += 'VALUES ($1, $2, $3)';
	// 	db.sql(sql, [id, message, user]);
	// });

	return promise;
}

exports.getPage = function(page) {
	var offset = 50 * (page - 1);
	var sql = 'SELECT * FROM topics ORDER BY last_post_time DESC LIMIT 50 OFFSET $1';
	
	var promise = db.sql(sql, [offset]);
	return promise;
}

exports.getTopic = function(id) {
	var sql = 'SELECT replies.username, title, message, create_time ';
	sql    += 'FROM topics INNER JOIN replies ON topics.id=replies.topic ';
	sql    += 'INNER JOIN users ON users.id=replies.username ';
	sql    += 'WHERE topics.id=$1 ';
	sql    += 'ORDER BY replies.id DESC';

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
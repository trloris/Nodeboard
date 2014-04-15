var pg = require('pg');
var conString = 'postgres://localhost/nodeboard';
var Q = require('Q');

var runSql = function(sql, parameters, callback) {
	var parameters = parameters || [];
	pg.connect(conString, function (err, client, done) {
		if (err) {
			callback(err);
		}
		client.query(sql, parameters, function (err, result) {
			done();
			
			if (err) {
				callback(err);
			}
			callback(err, result);
		});
	});
};

exports.sql = Q.denodeify(runSql);
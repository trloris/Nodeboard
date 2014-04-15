var db = require('./database');
var Q = require('Q');
var bcrypt = require('bcrypt');


var bcryptCompare = Q.denodeify(bcrypt.compare);
var bcryptHash = Q.denodeify(bcrypt.hash);

exports.authenticateUser = function(username, password) {
	var sql = 'SELECT * FROM users ';
	sql    += 'WHERE LOWER(username) = LOWER($1)';
    var promise = db.sql(sql, [username])
    .then(function(results) {
        var hashedPassword = results.rows[0].password;
        return [bcryptCompare(password, hashedPassword), results.rows[0].id];
    })
    .spread(function(hashResult, id) {
        if (hashResult) {
            return id;
        } else {
            return null;
        }
    });

    return promise;
};

exports.newUser = function(username, password, isAdmin) {
	var sql = 'INSERT INTO users (username, password, is_admin) '
	sql    += 'VALUES ($1, $2, $3)'
    var promise = bcryptHash(password, 10)
	.then(function(hashedPassword) {
		return Q.fcall(db.sql, sql, [username, hashedPassword, isAdmin]);
	});

	return promise;
};
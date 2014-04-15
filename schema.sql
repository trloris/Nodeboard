CREATE TABLE IF NOT EXISTS users(
	id			serial NOT NULL PRIMARY KEY,
	username	varchar(50) UNIQUE,
	password	varchar,
	is_admin	boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS topics(
	id 				 serial NOT NULL PRIMARY KEY,
	title 			 varchar(50),
	last_post_time   timestamp WITH TIME ZONE NOT NULL DEFAULT NOW(),
	username		 int REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS replies(
	id			serial NOT NULL PRIMARY KEY,
	topic   	int REFERENCES topics(id),
	message 	varchar(1000),
	create_time timestamp WITH TIME ZONE NOT NULL DEFAULT NOW(),
	username	int REFERENCES users(id)
);
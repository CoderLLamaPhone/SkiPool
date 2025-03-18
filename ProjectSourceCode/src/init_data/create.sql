DROP TABLE IF EXISTS users_db;
CREATE TABLE users_db(
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

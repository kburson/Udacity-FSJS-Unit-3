CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    username VARCHAR(32) NOT NULL UNIQUE,
    last_login_date TIMESTAMPTZ NOT NULL,
    password_digest VARCHAR(128) NOT NULL
);
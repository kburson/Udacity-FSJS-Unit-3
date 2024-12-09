# Unit 2: Postgress Sql withExpress API

after creating the `.env` file with all the `POSTGRES_*` environment variables to define the database service you can start the postgres docker image with the following.

## docker

Use docker to download and instantiate a postgress server

[docker postgress image](https://hub.docker.com/_/postgres/)
`$ docker run -d postgres`

or
`docker compose up`

## OSX App installation

https://postgresapp.com/downloads.html

https://eggerapps.at/postico2/
student license: $29

## Home brew Installation

To start postgresql@14 now and restart at login:
brew services start postgresql@14
Or, if you don't want/need a background service you can just run:
/opt/homebrew/opt/postgresql@14/bin/postgres -D /opt/homebrew/var/postgresql@14
==> tig
A sample of the default configuration has been installed to:
/opt/homebrew/opt/tig/share/tig/examples/tigrc
to override the system-wide default configuration, copy the sample to:
/opt/homebrew/etc/tigrc

zsh completions and functions have been installed to:
/opt/homebrew/share/zsh/site-functions

`psql fantasy_worlds`

## PSQL

start psql: `psql postgres`
in psql run the following:

- `CREATE USER shopping_user WITH PASSWORD 'password123';`
- `CREATE DATABASE shopping;`
- `\c shopping`
- `GRANT ALL PRIVILEGES ON DATABASE shopping TO shopping_user;`
  to test that it is working run \dt and it should output "No relations found."

## SQL in Postico

-- To reset and start over: remove prior user and database previously create

-- First, connect to the shopping database within the server
-- revoke all priviledges for shopping user on this database
REVOKE ALL ON DATABASE shopping FROM shopping_user;

-- repeat for any other databases
-- connect to shopping test then revoke user privs
REVOKE ALL ON DATABASE shopping_test FROM shopping_user;

-- Finally drop the database
DROP DATABASE shopping;
DROP DATABASE shopping_test;

-- Next connect to the postgres database on the server
-- and revoke all priviliges on the public schema
REVOKE ALL ON SCHEMA public FROM shopping_user;

-- Finally drop the user role
DROP USER shopping_user;

--- ##############################################

-- connect to postgres db
-- create the user
CREATE USER shopping_user WITH ENCRYPTED PASSWORD 'password123';

CREATE DATABASE shopping;
GRANT ALL PRIVILEGES ON DATABASE shopping TO shopping_user;

-- Now connect to the shopping database
\c shopping

-- and run the following command.
GRANT ALL ON SCHEMA public TO shopping_user;

CREATE DATABASE shopping_test;
-- Now connect to the shopping_test database and run the following command.
GRANT ALL PRIVILEGES ON DATABASE shopping_test TO shopping_user;

## Docker

docker pull postgres:14.11

### run the image in a container

docker run --name $DB_CONTAINER_NAME -e POSTGRES_PASSWORD=nimda -d postgres -p $POSTGRES_PORT:$POSTGRES_PORT

### using docker-compose

docker compose up -d

When the container starts up it will automatically instantiate a database with the name in your ${POSTGRES_DB} environment variable. The default user will be aliased to ${POSTGRES_USER}

### connect to container shell running psql

docker exec -it $DB_CONTAINER_NAME psql -U $POSTGRES_USER -d postgres

### or use docker desktop and run this inside the exec tab for the container

psql -U shopping_user postgres

run the following within the psql prompt

\i /var/lib/postgresql/setup.sql

## docker container management

docker compose down --volumes
docker compose rm postgres_data
docker volume ls

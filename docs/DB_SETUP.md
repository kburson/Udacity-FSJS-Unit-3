first set the user account and password into your `.env` file

```sh
# .env file
# when using docker compose this will name the application stack
COMPOSE_PROJECT_NAME=udacity-fsjs

# default runtime environment
POSTGRES_DEFAULT_ENV=test

# Name of the database to connect to from CLI and other clients
POSTGRES_DB=shopping             # dev  environment settings
POSTGRES_TEST_DB=shopping_test   # test environment settings

# Database connection
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432

# user account to login with
POSTGRES_USER=shopping_user

# These should be passed to service using Kubernetes secrets or some other secure config
POSTGRES_PASSWORD=password123

```

## Setup the database service

3 common ways to run a postgres server:

1. local service running as an independent process on your workstation
2. docker container running inside docker runtime within your workstation
3. remote server

### using a docker container

Use docker to download a postgres image and instantiate a docker container

**Note**  
 If you have postgres running as a local service you will need to kill the process before you start the docker container or use a different port on the docker container.

    Note: if you like running postgres locally then skip the docker setup, otherwise running the following command will stop the postgres service but remove it from the auto start list as well.

    ` brew services stop postgres `

    You can then later start it at any time using `brew services run postgres`

    if you need to lookup any other services using the port you want to use run this command
    ` lsof -i tcp:5432 `

    you can then kill any processes that are using your port, or choose a different port.
    ` kill -9 5432 `

docker pull postgres@14.13

docker run --name udacity_db -p ${POSTGRES_PORT} -d postgres

-- or --

docker compose up

## add the dev user account to the database service

### using docker compose to exec a single command inside the container

`docker compose exec postgres psql -U postgres -d postgres -c "CREATE ROLE ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';"`

exec into the docker container and setup the shopping user role and priviledges

`docker exec -it udacity_db psql -d shopping_test -U shopping_user -W`

```sql
-- connect to postgres db
-- create the user
CREATE USER shopping_user WITH ENCRYPTED PASSWORD 'password123';

CREATE DATABASE shopping;
GRANT ALL PRIVILEGES ON DATABASE shopping TO shopping_user;

-- Now connect to the shopping database
-- # \c shopping

-- and run the following command.
GRANT ALL ON SCHEMA public TO shopping_user;

-- Duplicate the above for a local QA database.
-- This will be used by test automation in your local build
CREATE DATABASE shopping_test;
-- Now connect to the shopping_test database and run the following command.
-- \c shopping_test
GRANT ALL PRIVILEGES ON DATABASE shopping_test TO shopping_user;


--  to test that it is working run \dt and it should output "No relations found."
```

## Create the table used for this project.

#### connect to the docker container and exec into the shell

`docker exec -it udacity_db psql -d shopping_test -U shopping_user -W`

#### in docker container shell from docker desktop:

`psql -U shopping_user`

#### from command line

psql -h 127.0.0.1 -p 5432 -U postgres postgres

### run commands to view tables

| command           | description           |
| ----------------- | --------------------- |
| `\l`              | list all databases    |
| `\c`              | connect to a database |
| `\dt`             | list database tables  |
| `\d <table-name>` | describe a table      |
| `\dn`             | list all schemas      |
| `\du`             | list all users/roles  |

## use db-migrate to initialize the database.

npx db-migrate up -e dev
npx db-migrate up -e test

to remove all tables and start over:

npx db-migrate reset -e dev
npx db-migrate reset -e test

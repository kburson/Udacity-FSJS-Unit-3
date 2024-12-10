# Udacity Full Stack JS

This is the course project for Udacity Full Stack JS

## TL;DR

1. install docker desktop
1. create `.env` file with appropriate settings (sample file show below)
1. import postman collection and environment into your postman instance
1. `npm i`
1. `docker compose up`
1. `npm run db.reset:test`
1. `npm run db.reset:dev`
1. `npx nx run express-api:lint`
1. `npx nx run express-api:test --codeCoverage=true`
1. `npx nx run express-api:serve:development `
1. excerise api endpoints using postman or curl

## Nx Dev Tools

I am using the Nx Dev tools to generate a mono-repo that is intended to contain both front end and backend applications in various forms ( express, fastify, spring-boot, golang ) + ( angular, vue )

The simplest way to interact with the Nx Dev Tools is to use the VSCode Nx Console, a plugin/extension that provides easy access to the various command line methods used to manage the project.
You can also execute these commands directly from the command line at the root level of the project. I will provide a list of sample commands you can use when evaluating this project.

## requirements

you will need to either have a POSTGRES db running locally (not recommended) or Docker Desktop running to host the docker-compose environment.

## setup

run `npm i` from the root of the project to download all the packaged dependencies.

## Project config

Next you will need a `.env` file to define the database connection parameters and specific secrets required by the authentication and cryptography modules. This `.env` file is listed in the `.gitignore` so it will never be included in the repository database. Here are the settings that I am using. You can modify these to your preferences. Notice that there are 2 database names listed: The `POSTGRES_TEST_DB` is used during unit testing and will be repeatedly torn down and rehydrated during the testing process. For manual testing use the `POSTGRESS_DB` instead.

**`.env`**

```sh

# when using docker compose this will name the application stack
COMPOSE_PROJECT_NAME=udacity-fsjs
DB_CONTAINER_NAME=udacity_db_server

# default runtime environment
POSTGRES_DEFAULT_ENV=dev

# dev environment settings
POSTGRES_DB=shopping
# test environment settings
POSTGRES_TEST_DB=shopping_test

# Database connection
POSTGRES_HOST=127.0.0.1
POSTGRES_USER=shopping_user
POSTGRES_PORT=5432

# These should be passed to service using Kubernetes secrets or some other secure config
POSTGRES_PASSWORD=password123

# the following are used for password cryptography
SALT_ROUNDS=10
CRYPTO_PEPPER=YankeeDoodle
TOKEN_SECRET=GodIsSovereign!

```

## DBMS Service -- Docker

With the `.env` file in place you can start up the docker instance of the postgres RDMS service.

`docker compose up`

## DBMS Table Generation

next you will want to populate your databases with the proper tables and references:

`npm run db.reset:dev`
`npm run db.reset:test`

## Project Management commands

next you will want to work with the api server code

| nx Command                                      | description                              |
| ----------------------------------------------- | ---------------------------------------- |
| npx nx run express-api:lint                     | lint all code under `apps/express-api`   |
| npx nx run express-api:test                     | run unit tests for express-api           |
| npx nx run express-api:test --codeCoverage=true | run unit test with coverage analysis     |
| npx nx run express-api:serve:development        | start the api server in development mode |

If you run the unit tests with coverage enabled you can find the coverage reports at the root level of the project `./coverage/apps/express-api`

## Postman Collection

Once you have the service running ( `nx run express-api:serve:development` )
you can finally exercise the service using the included postman collection.

> You will need to import both the postman collection and the environment (2 separate files located in the `./postman` directory);

Because several api endpoints are authenticated and require a valid Authorization header you will need to first use `POST /api/users` with a JSON body that includes **at the minimum** { "username": "myName", "password":"secret" }

> you can add the "first_name" and "last_name" properties if you like, but they are not required.

The response will include the Authorization Token (JWT) in the response headers. Copy this header (without the `Bearer ` preface) and paste this into the postman environment variable `LOGGED_IN_USER_TOKEN`.

after that all the api endpoints should work for you.

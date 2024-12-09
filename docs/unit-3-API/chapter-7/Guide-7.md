# Storefront Backend Project

## Getting Started

This repo contains a basic Node and Express app to get you started in constructing an API. To get started, clone this repo and run `yarn` in your terminal at the project root.

## Required Technologies

Your application must make use of the following libraries:

- Postgres for the database
- Node/Express for the application logic
- dotenv from npm for managing environment variables
- db-migrate from npm for migrations
- jsonwebtoken from npm for working with JWTs
- jasmine from npm for testing

## Environment

#### Workspace

This project can be done inside of this Udacity workspace. To ready your environment follow these steps:

##### In a terminal tab, create and run the database:

- switch to the postgres user `su postgres`
- start psql `psql postgres`
- in psql run the following:
  - `CREATE USER shopping_user WITH PASSWORD 'password123';`
  - `CREATE DATABASE shopping;`
  - `\c shopping`
  - `GRANT ALL PRIVILEGES ON DATABASE shopping TO shopping_user;`
- to test that it is working run `\dt` and it should output "No relations found."

##### In the 2nd terminal:

- install yarn `npm install yarn -g`
- install db-migrate on the machine for terminal commands `npm install db-migrate -g`
- check node version `node -v` - it needs to be 10 or 12 level
- _IF node was not 10 or 12 level, run_
  - `npm install -g n`
  - `n 10.18.0`
  - `PATH="$PATH"`
  - `node -v` to check that the version is 10 or 12
- install all project dependencies `yarn`
- to test that it is working, run `yarn watch` should show an app starting on `0.0.0.0:3000`

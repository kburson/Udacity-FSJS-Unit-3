# Testing Models Exercise

## Getting Started

This exercise contains the book model you created in the last exercise, your job is to add tests for each method.

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

Migrations to set up the database table for books from the last section are included in this exercise. To run them, follow the instructions below:

- install yarn `npm install yarn -g`
- install db-migrate on the machine for terminal commands `npm install db-migrate -g`
- check node version `node -v` - it needs to be 10 or 12 level
- _IF node was not 10 or 12 level, run_
  - `npm install -g n`
  - `n 10.18.0`
  - `PATH="$PATH"`
  - `node -v` to check that the version is 10 or 12
- install all project dependencies `yarn`
- to run the migrations ``
- to test that it is working, run `yarn watch` should show an app starting on `0.0.0.0:3000`

## Testing

**run any tests that include this file**  
npx vitest related --no-watch src/db/models/MythicalWeaponStore.ts

**run any tests that include a Store model**
npx vitest related --no-watch src/db/models/\*Store.ts

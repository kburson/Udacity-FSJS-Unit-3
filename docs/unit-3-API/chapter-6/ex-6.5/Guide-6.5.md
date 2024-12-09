# Adding Cart Support to the API

## Getting Started

This exercise builds off of previous exercises. Migrations for the necessary tables already exist, you must add the SQL for each table including the SQL to create the many to many relationship between orders and products. Then add the model methods and handlers to expose this relationship in the API.

**Stretch Goal**
Add logic to ensure that products can't be added to orders that are "closed" and send a 400 error to the client with a specialized message saying that the product could not be added because the order is complete.

## Environment

#### Workspace

This exercise can be done inside of this Udacity workspace. To ready your environment follow these steps:

##### In a terminal tab, create and run the database:

- switch to the postgres user `su postgres`
- start psql `psql postgres`
- in psql run the following:
  - `CREATE USER full_stack_user WITH PASSWORD 'password123';`
  - `CREATE DATABASE full_stack_dev;`
  - `\c full_stack_dev`
  - `GRANT ALL PRIVILEGES ON DATABASE full_stack_dev TO full_stack_user;`
- to test that it is working run `\dt` and it should output "No relations found."

##### In the 2nd terminal:

Migrations to set up the database tables from the last section are included in this exercise. To run them, follow the instructions below:

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

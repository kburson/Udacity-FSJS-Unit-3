# REST API Exercise

## Getting Started

In this exercise you are tasked with writing all the REST routes for a model. The model is for blog articles and you will find the model file already in the code base. Your job is to look at this model
and write the RESTful Express routes for it.

For now, your routes can return `res.send('this is the ____ route')` or another placeholder value, as we will be adding the logic that will run inside these routes in the next section.

## Environment

#### Workspace

This exercise can be done inside of this Udacity workspace. To ready your environment follow these steps:

##### In the terminal:

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

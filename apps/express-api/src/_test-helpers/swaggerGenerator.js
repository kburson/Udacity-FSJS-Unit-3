//https://github.com/davibaltar/example-swagger-autogen
import swaggerAutogen from 'swagger-autogen';

/*
Used to generate a swagger json file at build time that can be consumed by the swagger-ui component in the express server.
Because the JSDoc comments are stripped out of the ts files we need to pre-process this file at build time to load all the endpoint definitions.
*/
export const host = process.env.HOST ?? 'localhost';
export const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const doc = {
  info: {
    version: '', // by default: '1.0.0'
    title: '', // by default: 'REST API'
    description: '', // by default: ''
  },
  servers: [
    {
      url: `http://${host}:${port}`, // by default: 'http://localhost:3000'
      description: 'storefront-api host', // by default: ''
    },
    // { ... }
  ],
  tags: [
    // by default: empty Array
    {
      name: 'Storefront', // Tag name
      description: 'API for processing shopping cart and product catalog', // Tag description
    },
    // { ... }
  ],
  components: {}, // by default: empty object
};

const outputFile = '../assets/api-swagger.json';
const routes = ['../app.ts'];

swaggerAutogen({ openapi: '3.1.0' })(outputFile, routes, doc);

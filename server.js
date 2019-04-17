// basic express, graphql on the server side
// graphql schemas, nodemon
// json-server (see json:server in package.json and db.json)
const express = require('express');
const expressGraphQL = require('express-graphql');
const schema = require('./schema/schema');

const app = express();

app.use('/graphql', expressGraphQL({
  schema,
  graphiql: true
}));

app.listen(4100, () => {
  console.log('Listening');
});
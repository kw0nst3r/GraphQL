import {ApolloServer} from '@apollo/server';
import {startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from './typeDefs.js';
import {resolvers} from './resolvers.js';
import {dbConnection} from './config/mongoConnection.js';
import dotenv from 'dotenv';

dotenv.config(); //loads .env files
await dbConnection(); //connecting mongo

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const {url} = await startStandaloneServer(server, {
    listen: {port: 4000}
  });

console.log(`🚀 Server ready at ${url}`);

import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI_TEST = mongod.getUri();
  // Store the instance so globalTeardown can stop it
  global.__MONGOD__ = mongod;
}

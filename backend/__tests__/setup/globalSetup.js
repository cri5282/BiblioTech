import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing_only';
  process.env.NODE_ENV = 'test';
  // Store instance reference for teardown
  global.__MONGOD__ = mongod;
}

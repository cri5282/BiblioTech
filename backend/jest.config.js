export default {
  testEnvironment: 'node',
  transform: {},
  globalSetup: './__tests__/setup/globalSetup.js',
  globalTeardown: './__tests__/setup/globalTeardown.js',
  setupFilesAfterEnv: ['./__tests__/setup/jest.setup.js'],
  testTimeout: 30000,
  testMatch: ['**/__tests__/**/*.test.js'],
};

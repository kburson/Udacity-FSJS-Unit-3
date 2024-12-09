export default {
  displayName: 'express-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  colors: true,
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  runner: 'jest-serial-runner',
  // globalSetup should run once for before ANY test suite executes.
  globalSetup: './src/_test-helpers/globalSetup.ts',
  //globalTeardown: './src/_test-helpers/testTeardown.js',
  setupFilesAfterEnv: ['dotenv/config'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/express-api',
  // projects: [
  //   {
  //     // Uses the jest default runner for specification testing
  //     displayName: 'UNIT',
  //     testMatch: ['/src/**/*.unit.test.ts'],
  //   },
  //   {
  //     // Uses the serial runner instead for integration test files
  //     // especially important for tests that interact with Database
  //     // as they will setup and teardown test data and collide with each other.
  //     displayName: 'INTEGRATION',
  //     runner: 'jest-serial-runner',
  //     testMatch: ['/src/**/*.integration.test.ts'],
  //     //globalSetup: './src/_test-helpers/globalSetup.ts',
  //   },
  // ],
};

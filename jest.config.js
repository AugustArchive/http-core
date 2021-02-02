module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/*.spec.ts'],
  verbose: true,
  preset: 'ts-jest',
  name: 'augu-http-core',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json'
    }
  }
};

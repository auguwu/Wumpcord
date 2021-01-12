/**
 * Jest configuration for Wumpcord
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/*.spec.ts'],
  verbose: true,
  preset: 'ts-jest',
  name: 'Wumpcord',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json'
    }
  }
};

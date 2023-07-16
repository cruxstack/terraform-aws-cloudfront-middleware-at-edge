/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  resetMocks: true,
  testPathIgnorePatterns: [
    "dist"
  ],

  moduleNameMapper: {
    "#node-web-compat": "./node-web-compat-node.js",
  },
};

process.env = Object.assign(process.env, {
  LOG_LEVEL: 'silent',
});

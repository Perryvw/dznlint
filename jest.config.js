/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    "ts-jest": {
        tsconfig: "<rootDir>/test/tsconfig.json",
        diagnostics: {
          ignoreCodes: [ 'TS151001' ],
          warnOnly: false
        },
    },
  },
};
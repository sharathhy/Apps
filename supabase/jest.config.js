/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      { configFile: require.resolve('@wellness/config/babel.node.js') },
    ],
  },
};

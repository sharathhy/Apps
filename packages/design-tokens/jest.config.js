/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      { configFile: require.resolve('@wellness/config/babel.node.js') },
    ],
  },
};

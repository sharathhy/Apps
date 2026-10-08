const base = require('@wellness/config/eslint');

module.exports = [...base, { ignores: ['dist-native/*', 'web-build/*'] }];

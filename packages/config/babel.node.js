// Babel config for running plain TypeScript packages under Jest in Node.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
};

module.exports = {
  "env": {
    "commonjs": true,
    "es6": true,
    "browser": true
  },
  "globals": {
    "ServerErrors": true
  },
  "extends": "eslint:recommended",
  "rules": require('./.eslintrules')
};

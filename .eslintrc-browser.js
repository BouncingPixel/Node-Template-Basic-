module.exports = {
  "env": {
    "commonjs": true,
    "es6": true,
    "browser": true
  },
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module"
  },
  "globals": {
    "ServerErrors": true
  },
  "extends": "eslint:recommended",
  "rules": require('./.eslintrules')
};

const rules = require('./.eslintrules');
rules['no-console'] = [0];

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
    "paypal": true
  },
  "extends": "eslint:recommended",
  "rules": rules
};

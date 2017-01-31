const pkgcloud = require('pkgcloud');
const bluebird = require('bluebird');
const winston = require('winston');
const crypto = require('crypto');
const randomBytesAsync = bluebird.promisify(crypto.randomBytes);

// Ensure the directory is one up from tools, so relative paths work as expected
process.chdir(path.resolve(__dirname, '..'));

if (process.env.DEV_MODE === 'true') {
  process.env.NODE_ENV = 'development';
}

const nconf = require('nconf');
nconf.argv()
  .env()
  .file({ file: 'config/config.json' })
  .file({ file: 'config/local.json' })
  .defaults({
    port: 3000,
    requireHTTPS: false,
    logLevel: 'debug',
    redirectOn401: '/login',

    maxFailTries: 3, // after this many tries, start locks
    maxLockTime: 1 * 3600 * 1000, // maximum amount of a time an account may be locked for

    // Be sure to set other defaults here
  });

const rackspaceContainer = nconf.get('rackspaceContainer');
const rackspaceUsername = nconf.get('rackspaceUsername');
const rackspaceApiKey = nconf.get('rackspaceApiKey');

const client = pkgcloud.storage.createClient({
  provider: 'rackspace',
  username: rackspaceUsername,
  apiKey: rackspaceApiKey,
  region: 'DFW',
  useInternal: false
});

client.setCors = function(cors, callback) {
  this._request({
    method: 'POST',
    headers: {
      'X-Container-Meta-Access-Control-Allow-Origin': cors
    }
  }, function (err) {
    callback(err);
  });
};

const setCorsAsync = bluebird.promisify(client.setCors);
const setTemporaryUrlKeyAsync = bluebird.promisify(client.setTemporaryUrlKey);

function createRandomTempUrlKey(done) {
  return randomBytesAsync(26).then(function(buf) {
    // not true base64 or base62, but close enough for what is needed
    return buf.toString('base64').replace(/\//g,'').replace(/\+/g,'').substr(0, 32);
  });
}

const inquirer = require('inquirer');

createRandomTempUrlKey().then((token) => {
  winston.info('HMAC Token is: ' + token);

  return setTemporaryUrlKeyAsync();
});

inquirer.prompt([{
  type: 'input',
  name: 'cors',
  message: 'What URLs (for CORS)? Separate each URL with one space'
}]).then((res) => {
  return setCorsAsync(res.cors);
}).then(() => {
  return createRandomTempUrlKey();
}).then((token) => {
  return setTemporaryUrlKeyAsync(token);
}).then(() => {
  winston.info('Finished!');
  process.exit();
}).catch((error) => {
  winston.error('Failed to run tool');
  winston.error(error);
  process.exit(1);
});

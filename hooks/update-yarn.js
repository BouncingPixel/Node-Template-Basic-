const execSync = require('child_process').execSync;

const gitDiff = execSync('git diff --name-only HEAD^ HEAD');
const changedFiles = gitDiff.toString().split('\n');

const didYarnLockChange = changedFiles.some(file => file === 'yarn.lock');

if (didYarnLockChange) {
  execSync('yarn');
}

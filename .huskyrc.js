/**
 * husky config
 * @ref https://www.npmjs.com/package/husky
 */

module.exports = {
  hooks: {
    'pre-commit': 'lint-staged',
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS'
  }
};

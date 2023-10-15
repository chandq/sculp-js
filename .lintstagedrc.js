/**
 * lint-staged config
 * @ref https://www.npmjs.com/package/lint-staged
 */

module.exports = {
  '*.[tj]s': ['eslint --fix'],

  '*.json': ['prettier --write']
};

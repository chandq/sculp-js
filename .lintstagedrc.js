/**
 * lint-staged config
 * @ref https://www.npmjs.com/package/lint-staged
 */

module.exports = {
  '*.{js,css,vue,json,jsx}': ['prettier --write'],
  '*.ts?(x)': ['eslint --fix', 'prettier --write']
};

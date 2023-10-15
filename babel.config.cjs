/**
 * babel config
 * @ref https://www.babeljs.cn/
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          esmodules: true
        }
      }
    ],
    '@babel/preset-typescript'
  ]
};

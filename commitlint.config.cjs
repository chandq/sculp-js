/**
 * commitlint config
 * @ref http://commitlint.js.org/
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 选项说明：[级别, 适用情况, 字符数限制]
    // 级别：0为禁用(disable)，1为警告(warning)，2为错误(error)
    // 将最大长度扩大到 200 字符：
    'body-max-line-length': [0, 'always']

    // 或者如果你想完全取消对 body 每行长度的限制，可以直接设为 0：
    // 'body-max-line-length': [0, 'always', Infinity],
  }
};

module.exports = {
  env: {
    amd: true,
    es6: true,
    browser: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:vue/essential'],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  plugins: ['vue'],
  rules: {
    strict: 'warn',
    indent: ['warn', 2],
    'valid-jsdoc': 'off',
    'no-sync': 'off',
    'quote-props': 'off',
    'no-continue': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-empty': 'off',
    'no-unused-vars': 'off',
    'vue/no-unused-components': 'off',
    'guard-for-in': 'warn',
    'no-undefined': 'warn',
    'comma-dangle': 'warn',
    'no-prototype-builtins': 'off',
    'object-curly-spacing': 'off',
    'no-undef': 'off',
    'max-statements': 'off',
    complexity: 'off',
    'callback-return': ['warn', ['next']]
  }
};

module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true
  },
  plugins: ['eslint-plugin-prettier', 'eslint-plugin-import'],
  extends: [
    require.resolve('./lint-rules/baseLint.js'),

    require.resolve('./lint-rules/tsLint.js'),
    'prettier',
    'plugin:prettier/recommended',
    require.resolve('./lint-rules/prettier')
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  globals: {
    globalThis: true
  },
  rules: {
    'no-undef': 'error',
    '@typescript-eslint/no-unused-vars': [
      1,
      {
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-this-alias': 1
  }
};

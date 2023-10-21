module.exports = {
  env: {
    es6: true,
    browser: true,
    node: true
  },
  plugins: ['eslint-plugin-prettier', 'eslint-plugin-import'],
  extends: [
    require.resolve('./lint-rules/baseLint.js'),
    require.resolve('./lint-rules/tsLint.js'),

    'plugin:prettier/recommended'
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    ...require('./lint-rules/prettier.js'),
    'no-undef': 'error',
    '@typescript-eslint/no-unused-vars': [
      1,
      {
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ]
  }
};

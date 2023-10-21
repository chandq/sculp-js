module.exports = {
  env: {
    amd: true,
    es6: true,
    browser: true,
    node: true
  },
  extends: [
    require.resolve('./baseLint.js'),
    require.resolve('./tsLint.js'),
    'prettier',
    'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
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

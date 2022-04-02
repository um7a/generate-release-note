module.exports = {
  env: {
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  ignorePatterns: [
    'dist/**/*.js',
    'node_modules',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // I disable no-continue rule.
    // 'continue' statement is usable for me to early return.
    // 'no-continue' rule prevent me from do early return and
    // make me write long codes in a if block.
    'no-continue': 'off',
    // eslint failed with the error 'Missing file extension "ts"'.
    // But I can't write extension '.ts'. So I disable the rule.
    'import/extensions': [
      'error',
      'always',
      {
        ts: 'never',
      },
    ],
    // ++ is famous.
    'no-plusplus': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: [
          '.ts',
        ],
      },
    },
  },
};

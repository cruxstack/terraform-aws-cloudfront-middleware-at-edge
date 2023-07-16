module.exports = {
  plugins: [
    'import',
    'jest',
  ],
  rules: {
    'func-style': 'error',
  },
  overrides: [
    {
      files: [
        '**/*.{ts,tsx}',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: [
          './tsconfig.json',
        ],
      },
      plugins: [
        '@typescript-eslint',
      ],
      extends: [
        'airbnb-typescript/base',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-floating-promises': 'error',
      },
    },
    {
      files: [
        'scripts/**/*.js',
      ],
      parserOptions: {
        ecmaVersion: "latest",
      },
      env: {
        es6: true
      }
    }
  ],
};

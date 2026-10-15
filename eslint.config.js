'use strict';
// ESLint flat config. Dev dependency only, nothing here ships to the browser or the server.
// Rules that matter for this project: no eval, no string-built functions, no unsanitized HTML.
const js = require('@eslint/js');
const globals = require('globals');
const noUnsanitized = require('eslint-plugin-no-unsanitized');

const safety = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-unsanitized/method': 'error',
  'no-unsanitized/property': 'error'
};

module.exports = [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  {
    // Browser files. Plain scripts, not modules.
    files: ['public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser, module: 'readonly' } },
    plugins: { 'no-unsanitized': noUnsanitized },
    rules: safety
  },
  {
    // Server and tests: Node, CommonJS.
    files: ['server/**/*.js', 'test/**/*.test.js', 'eslint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
    plugins: { 'no-unsanitized': noUnsanitized },
    rules: safety
  }
];

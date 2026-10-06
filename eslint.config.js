// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    // [ng-scaffold] Step 0: enable typed linting (TypeScript project service). Signal-aware rules such
    // as `no-uncalled-signals` need type information.
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // [ng-scaffold] Step 1: enforce the Angular v22 best practices listed in CLAUDE.md
      // (signals, `@Service()`, host metadata, output refs) on top of `tsRecommended`.
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-service-decorator': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/reactive-context-must-read-signal': 'error',
      '@angular-eslint/no-implicit-take-until-destroyed': 'error',
      '@angular-eslint/relative-url-prefix': 'error',
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@angular-eslint/no-experimental': 'warn',
      // [ng-scaffold] Step 2: the non-formatting rule ng-matero adds. Its formatting rules
      // (`quotes`, `semi`, `max-len`, `quote-props`) are deprecated in ESLint 10 and left to Prettier.
      'object-shorthand': ['error', 'always', { avoidQuotes: true }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // [ng-scaffold] Step 3: template rules for the v22 best practices (control flow helpers,
      // class/style bindings instead of ngClass/ngStyle, NgOptimizedImage, self-closing tags).
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
      '@angular-eslint/template/prefer-ngsrc': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-any': 'error',
    },
  },
]);

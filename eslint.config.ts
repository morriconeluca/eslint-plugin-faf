import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import { importX } from 'eslint-plugin-import-x';
import { configs as perfectionistConfigs } from 'eslint-plugin-perfectionist';
import { configs as sonarjsConfigs } from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '.cache/**',
    '.stryker-tmp/**',
    'coverage/**',
    'dist/**',
    'node_modules/**',
    'reports/**',
    'tmp/**',
  ]),
  js.configs.recommended,
  ...tseslintConfigs.strictTypeChecked,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  perfectionistConfigs['recommended-natural'],
  sonarjsConfigs.recommended,
  unicorn.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      '@eslint-community/eslint-comments/no-use': ['error', { allow: [] }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-check': true,
          'ts-expect-error': true,
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableObject: false,
          allowNumber: false,
          allowString: false,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/no-cycle': [
        'error',
        {
          ignoreExternal: true,
          maxDepth: 22,
        },
      ],
      'sonarjs/arguments-usage': 'error',
      'sonarjs/array-constructor': 'error',
      'sonarjs/arrow-function-convention': [
        'error',
        { requireParameterParentheses: true },
      ],
      'sonarjs/bool-param-default': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/comment-regex': [
        'error',
        {
          message:
            'Comments are forbidden: code must be self-documenting to prevent LLM cognitive bias.',
          regularExpression: '.*',
        },
      ],
      'sonarjs/cyclomatic-complexity': ['error', { threshold: 10 }],
      'sonarjs/declarations-in-global-scope': 'error',
      'sonarjs/destructuring-assignment-syntax': 'error',
      'sonarjs/elseif-without-else': 'error',
      'sonarjs/expression-complexity': ['error', { max: 3 }],
      'sonarjs/nested-control-flow': ['error', { maximumNestingLevel: 3 }],
      'sonarjs/no-built-in-override': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/no-commented-code': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-for-in-iterable': 'error',
      'sonarjs/no-function-declaration-in-block': 'error',
      'sonarjs/no-implicit-dependencies': 'error',
      'sonarjs/no-inconsistent-returns': 'error',
      'sonarjs/no-incorrect-string-concat': 'error',
      'sonarjs/no-nested-incdec': 'error',
      'sonarjs/no-nested-switch': 'error',
      'sonarjs/no-require-or-define': 'error',
      'sonarjs/no-return-type-any': 'error',
      'sonarjs/no-sonar-comments': 'error',
      'sonarjs/no-undefined-assignment': 'error',
      'sonarjs/no-unused-function-argument': 'error',
      'sonarjs/no-variable-usage-before-declaration': 'error',
      'sonarjs/no-wildcard-import': 'error',
      'sonarjs/non-number-in-arithmetic-expression': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/too-many-break-or-continue-in-loop': 'error',
      'sonarjs/unicode-aware-regex': 'error',
      'unicorn/filename-case': 'off',
      'unicorn/name-replacements': [
        'error',
        {
          checkFilenames: false,
          replacements: {
            src: false,
            util: false,
            utils: false,
          },
        },
      ],
      'unicorn/no-null': 'off',
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'unicorn/no-process-exit': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'sonarjs/no-duplicate-string': 'off',
    },
  },
]);

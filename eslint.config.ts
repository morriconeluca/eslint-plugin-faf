import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import js from '@eslint/js';
import { importX } from 'eslint-plugin-import-x';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import { configs as perfectionistConfigs } from 'eslint-plugin-perfectionist';
import { configs as sonarjsConfigs } from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';

import fafConfig from './fafconfig.js';
import { commentPolicyRule } from './scripts/eslint/comment-policy.rule.js';
import { symbolLawsRule } from './scripts/eslint/symbol-laws.rule.js';

const localTree = fafConfig.faf.locals[0];
const roles = localTree.roles.map((r) => r.name);
const categories = Object.fromEntries(
  localTree.roles.map((r) => [r.category, r.name])
);
const allowMultipleSymbolsRoles = localTree.roles
  .filter((r) => 'allowMultipleSymbols' in r)
  .map((r) => r.name);
const subGraphRoles = localTree.subGraphRoles.map((r) => r.name);

const COMMON_FUNCTIONAL_RESTRICTIONS = [
  {
    message:
      'Classes are forbidden. Use pure functions and functional composition.',
    selector: 'ClassDeclaration',
  },
  {
    message:
      'Class expressions are forbidden. Use pure functions and functional composition.',
    selector: 'ClassExpression',
  },
  {
    message:
      'The this keyword is forbidden. Use pure functions and functional composition.',
    selector: 'ThisExpression',
  },
] as const;

const THROW_RESTRICTION = {
  message:
    'Throwing exceptions is forbidden outside assert-invariant. Use typed results/outcomes.',
  selector: 'ThrowStatement',
} as const;

const TYPE_FILE_RESTRICTIONS = [
  {
    message:
      'Variable declarations are forbidden in type files. Type files must only contain types.',
    selector: 'VariableDeclaration',
  },
  {
    message:
      'Function declarations are forbidden in type files. Type files must only contain types.',
    selector: 'FunctionDeclaration',
  },
  {
    message: 'Enums are forbidden in type files. Use union types.',
    selector: 'TSEnumDeclaration',
  },
  {
    message: 'Namespaces and module declarations are forbidden in type files.',
    selector: 'TSModuleDeclaration',
  },
  {
    message:
      'Executable expression statements are forbidden in type files. Type files must only contain types.',
    selector: 'ExpressionStatement',
  },
  {
    message: 'Default exports of values are forbidden in type files.',
    selector: 'ExportDefaultDeclaration',
  },
  {
    message: 'Value imports are forbidden in type files. Use import type.',
    selector: "ImportDeclaration[importKind='value']",
  },
] as const;

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
      repository: {
        rules: {
          'comment-policy': commentPolicyRule,
          'symbol-laws': symbolLawsRule,
        },
      },
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
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['PascalCase'],
          prefix: ['T'],
          selector: 'typeAlias',
        },
      ],
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
      'no-restricted-syntax': [
        'error',
        ...COMMON_FUNCTIONAL_RESTRICTIONS,
        THROW_RESTRICTION,
      ],
      'repository/comment-policy': 'error',
      'sonarjs/arguments-usage': 'error',
      'sonarjs/array-constructor': 'error',
      'sonarjs/arrow-function-convention': [
        'error',
        { requireParameterParentheses: true },
      ],
      'sonarjs/bool-param-default': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
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
    files: [
      'src/_src@shared/_domain/_utils/assert-invariant/assert-invariant.util.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...COMMON_FUNCTIONAL_RESTRICTIONS],
    },
  },
  {
    files: ['**/*.type.ts'],
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      'jsdoc/check-tag-names': [
        'error',
        {
          definedTags: ['default', 'example'],
        },
      ],
      'jsdoc/informative-docs': 'error',
      'jsdoc/no-blank-blocks': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: ['TSTypeAliasDeclaration', 'TSPropertySignature'],
          require: {
            FunctionDeclaration: false,
          },
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...COMMON_FUNCTIONAL_RESTRICTIONS,
        THROW_RESTRICTION,
        ...TYPE_FILE_RESTRICTIONS,
      ],
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
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
  {
    files: ['src/**/*.ts'],
    rules: {
      'repository/symbol-laws': [
        'error',
        {
          allowMultipleSymbols: allowMultipleSymbolsRoles,
          categories,
          roles,
          subGraphRoles,
        },
      ],
    },
  },
]);

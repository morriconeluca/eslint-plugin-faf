import { RuleTester } from 'eslint';
import { parser as tsParser } from 'typescript-eslint';
import { describe, it } from 'vitest';

import { noTautologicalAssertionRule } from '../../scripts/eslint/no-tautological-assertion.rule.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
});

const filename = 'example.spec.ts';

ruleTester.run('no-tautological-assertion', noTautologicalAssertionRule, {
  invalid: [
    {
      code: "import { X } from './values.constant.js';\nexpect(X);",
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
    {
      code: "import * as C from './values.constant.js';\nexpect(C.X);",
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
    {
      code: "import { X, Y } from './values.config.js';\nexpect([X, Y]);",
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
    {
      code: "import { X } from './values.constant.js';\nexpect({ a: X });",
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
    {
      code: 'import { X } from "./values.constant.js";\nexpect(`${X}`);',
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
    {
      code: "import { X } from './values.constant.js';\nconst y = X;\nexpect(y);",
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
    {
      code: "import { X } from './values.constant.js';\nexpect.soft(X);",
      errors: [{ messageId: 'tautologicalAssertion' }],
      filename,
    },
  ],
  valid: [
    {
      code: "import { X } from './values.constant.js';\nfunction fn(): string { return 'value'; }\nexpect(fn()).toBe(X);",
      filename,
    },
    {
      code: "import { X } from './values.constant.js';\nfunction fn(): { readonly x: string } { return { x: 'value' }; }\nconst result = fn();\nexpect(result.x).toBe(X);",
      filename,
    },
    {
      code: "import { X } from './values.constant.js';\nfunction f(): string { return 'f'; }\nfunction g(): string { return 'g'; }\nexpect(X.length > 0 ? f() : g());",
      filename,
    },
    {
      code: 'const localValue = 1;\nexpect(localValue);',
      filename,
    },
    {
      code: "import { X } from './values.util.js';\nexpect(X);",
      filename,
    },
    {
      code: "import { X } from './values.constant.js';\nlet y = X;\nexpect(y);",
      filename,
    },
  ],
});

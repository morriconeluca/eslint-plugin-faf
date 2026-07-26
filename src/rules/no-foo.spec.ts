import * as parser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';

import { noFooRule } from './no-foo.js';

// Bind Vitest globals to globalThis so RuleTester can find them
Object.assign(globalThis, { afterAll, describe, it });

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    parser,
    sourceType: 'module',
  },
});

ruleTester.run('no-foo', noFooRule, {
  invalid: [
    {
      code: 'const foo = 42;',
      errors: [{ messageId: 'noFooMessage' }],
    },
  ],
  valid: [
    {
      code: 'const bar = 42;',
    },
  ],
});

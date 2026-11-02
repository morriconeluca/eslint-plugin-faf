import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';

import { commentPolicyRule } from '../../scripts/eslint/comment-policy.rule.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('comment-policy', commentPolicyRule, {
  invalid: [
    {
      code: '// line comment\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.ts',
    },
    {
      code: '/* non-jsdoc block comment */\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.ts',
    },
    {
      code: '/** jsdoc in regular file */\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.ts',
    },
    {
      code: '// line comment in type file\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.type.ts',
    },
    {
      code: '/* non-jsdoc block in type file */\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.type.ts',
    },
    {
      code: '// * line comment with asterisk\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.type.ts',
    },
    {
      code: '#!/usr/bin/env node\nexport const x = 1;',
      errors: [{ messageId: 'forbiddenComment' }],
      filename: 'foo.ts',
    },
  ],
  valid: [
    {
      code: 'export const x = 1;',
      filename: 'foo.ts',
    },
    {
      code: 'export const x = 1;',
      filename: 'foo.type.ts',
    },
    {
      code: '/**\n * Informative JSDoc description.\n */\nexport const x = 1;',
      filename: 'foo.type.ts',
    },
  ],
});

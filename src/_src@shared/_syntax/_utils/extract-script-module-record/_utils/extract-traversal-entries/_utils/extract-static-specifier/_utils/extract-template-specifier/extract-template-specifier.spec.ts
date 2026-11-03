import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { extractTemplateSpecifier } from './index.js';

const parseTemplateLiteral = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement?.type === 'ExpressionStatement', 'Expected expr');
  assertInvariant(
    statement.expression.type === 'TemplateLiteral',
    'Expected template'
  );
  return statement.expression;
};

describe('extractTemplateSpecifier', () => {
  it('extracts cooked string value', () => {
    const node = parseTemplateLiteral('`my-specifier`;');
    expect(extractTemplateSpecifier(node)).toBe('my-specifier');
  });

  it('falls back to raw value when cooked is null', () => {
    const node = parseTemplateLiteral('`raw-specifier`;');
    const modified = {
      ...node,
      quasis: [
        {
          ...node.quasis[0],
          end: 15,
          start: 0,
          tail: true,
          type: 'TemplateElement' as const,
          value: { cooked: null, raw: 'fallback-raw' },
        },
      ],
    };
    expect(extractTemplateSpecifier(modified)).toBe('fallback-raw');
  });

  it('returns null when quasis array is empty', () => {
    const node = parseTemplateLiteral('`empty`;');
    const modified = {
      ...node,
      quasis: [],
    };
    expect(extractTemplateSpecifier(modified)).toBeNull();
  });

  it('returns null when expressions array has items', () => {
    const node = parseTemplateLiteral('`prefix/${dynamic}`;');
    expect(extractTemplateSpecifier(node)).toBeNull();
  });
});

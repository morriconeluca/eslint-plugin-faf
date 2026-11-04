import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TPatternIdentifier } from './index.js';

import { assertInvariant } from '../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { collectPatternIdentifiers } from './index.js';

const parseAndCollect = (code: string): TPatternIdentifier[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'VariableDeclaration',
    'Expected VariableDeclaration'
  );
  const pattern = statement.declarations[0]?.id;
  assertInvariant(pattern !== undefined, 'Expected declarator pattern');
  const results: TPatternIdentifier[] = [];
  collectPatternIdentifiers(pattern, results);
  return results;
};

describe('collectPatternIdentifiers', () => {
  it('collects identifier pattern', () => {
    const results = parseAndCollect('const simple = 1;');
    expect(results).toEqual([{ name: 'simple', start: 6 }]);
  });

  it('collects assignment pattern', () => {
    const results = parseAndCollect('const { val = 5 } = options;');
    expect(results).toEqual([{ name: 'val', start: 8 }]);
  });

  it('collects array pattern with sparse elements and rest', () => {
    const results = parseAndCollect('const [first, , ...tail] = items;');
    expect(results).toEqual([
      { name: 'first', start: 7 },
      { name: 'tail', start: 19 },
    ]);
  });

  it('collects object pattern properties and rest element', () => {
    const results = parseAndCollect('const { a, b: alias, ...rest } = obj;');
    expect(results).toEqual([
      { name: 'a', start: 8 },
      { name: 'alias', start: 14 },
      { name: 'rest', start: 24 },
    ]);
  });
});

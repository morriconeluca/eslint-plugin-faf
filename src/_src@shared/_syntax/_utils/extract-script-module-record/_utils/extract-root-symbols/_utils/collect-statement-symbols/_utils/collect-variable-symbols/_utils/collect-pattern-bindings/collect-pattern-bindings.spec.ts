import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { collectPatternBindings } from './index.js';

const parseAndCollect = (code: string): TRootSymbol[] => {
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
  const locator = createSourceLocator(code);
  const symbols: TRootSymbol[] = [];
  collectPatternBindings(pattern, locator, symbols);
  return symbols;
};

describe('collectPatternBindings', () => {
  it('collects identifier binding', () => {
    const symbols = parseAndCollect('const simple = 1;');
    expect(symbols).toEqual([
      { name: 'simple', position: { column: 7, line: 1 }, space: 'value' },
    ]);
  });

  it('collects assignment pattern binding', () => {
    const symbols = parseAndCollect('const { defaultValue = 10 } = options;');
    expect(symbols).toEqual([
      {
        name: 'defaultValue',
        position: { column: 9, line: 1 },
        space: 'value',
      },
    ]);
  });

  it('collects array pattern bindings including sparse elements', () => {
    const symbols = parseAndCollect('const [first, , third] = list;');
    expect(symbols).toEqual([
      { name: 'first', position: { column: 8, line: 1 }, space: 'value' },
      { name: 'third', position: { column: 17, line: 1 }, space: 'value' },
    ]);
  });

  it('collects object pattern properties and rest element', () => {
    const symbols = parseAndCollect(
      'const { alpha, beta: renamed, ...rest } = obj;'
    );
    expect(symbols).toEqual([
      { name: 'alpha', position: { column: 9, line: 1 }, space: 'value' },
      { name: 'renamed', position: { column: 22, line: 1 }, space: 'value' },
      { name: 'rest', position: { column: 34, line: 1 }, space: 'value' },
    ]);
  });

  it('collects array rest element', () => {
    const symbols = parseAndCollect('const [...tail] = items;');
    expect(symbols).toEqual([
      { name: 'tail', position: { column: 11, line: 1 }, space: 'value' },
    ]);
  });
});

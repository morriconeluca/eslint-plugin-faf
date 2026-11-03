import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { collectNamespaceSymbols } from './index.js';

const parseAndCollectNamespace = (code: string): TRootSymbol[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'TSModuleDeclaration',
    'Expected TSModuleDeclaration'
  );
  const locator = createSourceLocator(code);
  const symbols: TRootSymbol[] = [];
  collectNamespaceSymbols(statement, locator, symbols);
  return symbols;
};

describe('collectNamespaceSymbols', () => {
  it('collects namespace with value space when it contains values', () => {
    const symbols = parseAndCollectNamespace(
      'namespace Foo { export const val = 1; }'
    );
    expect(symbols).toEqual([
      { name: 'Foo', position: { column: 11, line: 1 }, space: 'value' },
    ]);
  });

  it('collects namespace with type space when it contains only types', () => {
    const symbols = parseAndCollectNamespace(
      'namespace Foo { export type T = string; }'
    );
    expect(symbols).toEqual([
      { name: 'Foo', position: { column: 11, line: 1 }, space: 'type' },
    ]);
  });

  it('ignores module declarations that are not namespace kind with literal id', () => {
    const symbols = parseAndCollectNamespace(
      'declare module "ambient" { export const x = 1; }'
    );
    expect(symbols).toHaveLength(0);
  });

  it('ignores module declarations that have identifier id but module kind', () => {
    const symbols = parseAndCollectNamespace(
      'module IdentifierModule { export const x = 1; }'
    );
    expect(symbols).toHaveLength(0);
  });
});

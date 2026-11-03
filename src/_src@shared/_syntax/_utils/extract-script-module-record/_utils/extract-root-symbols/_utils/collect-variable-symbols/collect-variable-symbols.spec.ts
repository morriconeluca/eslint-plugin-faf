import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { collectVariableSymbols } from './index.js';

describe('collectVariableSymbols', () => {
  it('collects variable symbols from multiple declarators', () => {
    const code = 'const first = 1, second = 2;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'VariableDeclaration',
      'Expected variable'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];

    collectVariableSymbols(statement, locator, symbols);

    expect(symbols).toHaveLength(2);
    expect(symbols[0]?.name).toBe('first');
    expect(symbols[1]?.name).toBe('second');
  });
});

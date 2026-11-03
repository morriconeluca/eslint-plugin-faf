import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../../_types/module-record.type.js';

import { isAllTypeSpace } from './index.js';

describe('isAllTypeSpace', () => {
  it('returns true when all matching symbols are type space', () => {
    const symbols: TRootSymbol[] = [
      { name: 'MyType', position: { column: 1, line: 1 }, space: 'type' },
    ];
    expect(isAllTypeSpace('MyType', symbols)).toBe(true);
  });

  it('returns false when no symbols match', () => {
    const symbols: TRootSymbol[] = [
      { name: 'Other', position: { column: 1, line: 1 }, space: 'type' },
    ];
    expect(isAllTypeSpace('Missing', symbols)).toBe(false);
  });

  it('returns false when matching symbol is in value space', () => {
    const symbols: TRootSymbol[] = [
      { name: 'ValueSymbol', position: { column: 1, line: 1 }, space: 'value' },
    ];
    expect(isAllTypeSpace('ValueSymbol', symbols)).toBe(false);
  });

  it('returns false when merged symbol has both value and type declarations', () => {
    const symbols: TRootSymbol[] = [
      { name: 'Merged', position: { column: 1, line: 1 }, space: 'value' },
      { name: 'Merged', position: { column: 1, line: 2 }, space: 'type' },
    ];
    expect(isAllTypeSpace('Merged', symbols)).toBe(false);
  });
});

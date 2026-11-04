import { describe, expect, it } from 'vitest';

import { createSourceLocator } from './index.js';

describe('createSourceLocator', () => {
  it('returns line 1 column 1 for offset 0 in empty text', () => {
    const locator = createSourceLocator('');
    expect(locator(0)).toEqual({ column: 1, line: 1 });
  });

  it('clamps negative offsets to line 1 column 1', () => {
    const locator = createSourceLocator('const x = 1;');
    expect(locator(-10)).toEqual({ column: 1, line: 1 });
  });

  it('computes correct column on a single line', () => {
    const text = 'const variable = 42;';
    const locator = createSourceLocator(text);
    expect(locator(0)).toEqual({ column: 1, line: 1 });
    expect(locator(6)).toEqual({ column: 7, line: 1 });
    expect(locator(text.length)).toEqual({ column: 21, line: 1 });
  });

  it('computes correct line and column across multiple lines', () => {
    const text = 'line1\nline2\nline3';
    const locator = createSourceLocator(text);

    expect(locator(0)).toEqual({ column: 1, line: 1 });
    expect(locator(5)).toEqual({ column: 6, line: 1 });
    expect(locator(6)).toEqual({ column: 1, line: 2 });
    expect(locator(8)).toEqual({ column: 3, line: 2 });
    expect(locator(11)).toEqual({ column: 6, line: 2 });
    expect(locator(12)).toEqual({ column: 1, line: 3 });
    expect(locator(16)).toEqual({ column: 5, line: 3 });
  });

  it('handles windows CRLF line endings accurately', () => {
    const text = 'first\r\nsecond\r\nthird';
    const locator = createSourceLocator(text);

    expect(locator(0)).toEqual({ column: 1, line: 1 });
    expect(locator(7)).toEqual({ column: 1, line: 2 });
    expect(locator(15)).toEqual({ column: 1, line: 3 });
  });
});

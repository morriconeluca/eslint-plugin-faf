import { describe, expect, it } from 'vitest';

import { skipAtImportStatement } from './skip-at-import-statement.util.js';

describe('skipAtImportStatement', () => {
  it.each([
    {
      expectedIndex: 31,
      name: 'multiline media query in css mode',
      text: ' screen\nand (max-width: 600px); next',
    },
    {
      expectedIndex: 31,
      name: 'media query',
      text: ' screen and (max-width: 600px); next',
    },
    {
      expectedIndex: 18,
      name: 'layer() clause',
      text: ' layer(framework); next',
    },
    {
      expectedIndex: 25,
      name: 'supports() clause',
      text: ' supports(display: grid); next',
    },
  ])('skips remainder until semicolon for $name', ({ expectedIndex, text }) => {
    const result = skipAtImportStatement(text, 0, false);

    expect(result.nextIndex).toBe(expectedIndex);
  });

  it('stops at closing brace if @import is unclosed inside block', () => {
    const text = ' layer(framework)} next';
    const result = skipAtImportStatement(text, 0, false);

    expect(result.nextIndex).toBe(17);
  });

  it.each([
    {
      name: 'LF',
      text: ' layer(framework)\nnext',
    },
    {
      name: 'CR',
      text: ' layer(framework)\rnext',
    },
  ])('stops at $name newline in Sass mode', ({ text }) => {
    const result = skipAtImportStatement(text, 0, true);

    expect(result.nextIndex).toBe(17);
  });

  it('stops at EOF if statement is unclosed', () => {
    const text = ' screen and (min-width: 1000px)';
    const result = skipAtImportStatement(text, 0, false);

    expect(result.nextIndex).toBe(text.length);
  });
});

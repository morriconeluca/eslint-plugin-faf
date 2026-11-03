import { describe, expect, it } from 'vitest';

import { readAtImportSpecifier } from './read-at-import-specifier.util.js';

describe('readAtImportSpecifier', () => {
  it.each([
    {
      expectedRaw: 'styles.css',
      name: 'double-quoted',
      text: '"styles.css";',
    },
    {
      expectedRaw: 'styles.css',
      name: 'single-quoted',
      text: "'styles.css';",
    },
    {
      expectedRaw: 'styles.css',
      name: 'url double-quoted',
      text: 'url("styles.css");',
    },
    {
      expectedRaw: 'styles.css',
      name: 'url single-quoted',
      text: "url('styles.css');",
    },
    {
      expectedRaw: 'styles.css',
      name: 'url unquoted',
      text: 'url(styles.css);',
    },
    {
      expectedRaw: 'reset',
      name: 'bare unquoted',
      text: 'reset\n',
    },
  ])('extracts $name specifier', ({ expectedRaw, text }) => {
    const result = readAtImportSpecifier(text, 0);

    expect(result.raw).toBe(expectedRaw);
    expect(result.nextIndex).toBeGreaterThan(0);
  });

  it('handles empty url() inside @import', () => {
    const text = 'url();';
    const result = readAtImportSpecifier(text, 0);

    expect(result.raw).toBe('');
    expect(result.nextIndex).toBe(5);
  });

  it.each([
    {
      expectedRaw: 'escaped"quote.css',
      name: 'escaped-quote',
      text: '"escaped\\"quote.css"',
    },
    {
      expectedRaw: 'unclosed',
      name: 'unclosed-at-newline',
      text: '"unclosed\n',
    },
    {
      expectedRaw: 'trailing',
      name: 'trailing-backslash',
      text: '"trailing\\',
    },
  ])('handles $name within quoted specifier', ({ expectedRaw, text }) => {
    const result = readAtImportSpecifier(text, 0);

    expect(result.raw).toBe(expectedRaw);
  });
});

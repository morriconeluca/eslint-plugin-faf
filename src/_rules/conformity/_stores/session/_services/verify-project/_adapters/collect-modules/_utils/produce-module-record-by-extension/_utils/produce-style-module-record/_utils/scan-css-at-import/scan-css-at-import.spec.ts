import { describe, expect, it } from 'vitest';

import { IDENTIFIER_CHAR_PATTERN } from './scan-css-at-import.constant.js';
import { scanCssAtImport } from './scan-css-at-import.util.js';

describe('scanCssAtImport', () => {
  describe('IDENTIFIER_CHAR_PATTERN', () => {
    it('matches valid single identifier characters', () => {
      expect(IDENTIFIER_CHAR_PATTERN.test('a')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('Z')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('9')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('-')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('_')).toBe(true);
    });

    it('rejects multi-character strings and invalid characters', () => {
      expect(IDENTIFIER_CHAR_PATTERN.test('ab')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test('a!')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test('!a')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test('')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test(' ')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test(';')).toBe(false);
    });
  });
  it.each([
    {
      name: 'keyword does not match @import',
      startIndex: 0,
      text: '@charset "utf-8";',
    },
    {
      name: '@import followed by letter',
      startIndex: 0,
      text: '@important "value";',
    },
    {
      name: '@import followed by hyphen',
      startIndex: 0,
      text: '@import-theme "value";',
    },
    {
      name: '@import followed by underscore',
      startIndex: 0,
      text: '@import_theme "value";',
    },
    {
      name: '@import followed by digit',
      startIndex: 0,
      text: '@import2 "value";',
    },
    {
      name: '@import exactly at EOF without whitespace',
      startIndex: 0,
      text: '@import',
    },
  ])('returns empty result when $name', ({ startIndex, text }) => {
    const result = scanCssAtImport(text, startIndex, false);

    expect(result.raw).toBeUndefined();
    expect(result.nextIndex).toBe(startIndex);
  });

  it.each([
    {
      expectedRaw: 'styles.css',
      name: 'double-quoted',
      text: '@import "styles.css";',
    },
    {
      expectedRaw: 'styles.css',
      name: 'single-quoted',
      text: "@import 'styles.css';",
    },
    {
      expectedRaw: 'styles.css',
      name: 'url double-quoted',
      text: '@import url("styles.css");',
    },
    {
      expectedRaw: 'styles.css',
      name: 'url single-quoted',
      text: "@import url('styles.css');",
    },
    {
      expectedRaw: 'styles.css',
      name: 'url unquoted',
      text: '@import url(styles.css);',
    },
  ])('extracts specifier from $name @import', ({ expectedRaw, text }) => {
    const result = scanCssAtImport(text, 0, false);

    expect(result.raw).toBe(expectedRaw);
    expect(result.nextIndex).toBe(text.length);
  });

  it.each([
    {
      expectedRaw: 'styles.css',
      name: 'media query',
      text: '@import "styles.css" screen and (max-width: 600px);',
    },
    {
      expectedRaw: 'theme.css',
      name: 'layer() clause',
      text: '@import url("theme.css") layer(framework.base);',
    },
    {
      expectedRaw: 'theme.css',
      name: 'supports() clause',
      text: '@import "theme.css" supports(display: grid);',
    },
    {
      expectedRaw: '',
      name: 'empty url()',
      text: '@import url();',
    },
  ])('skips trailing declarations for $name', ({ expectedRaw, text }) => {
    const result = scanCssAtImport(text, 0, false);

    expect(result.raw).toBe(expectedRaw);
    expect(result.nextIndex).toBe(text.length);
  });

  it('scans @import at non-zero startIndex', () => {
    const text = '     @import "theme.css";';
    const result = scanCssAtImport(text, 5, false);

    expect(result.raw).toBe('theme.css');
    expect(result.nextIndex).toBe(text.length);
  });

  it('handles unquoted Sass import terminated by newline', () => {
    const text = '@import reset\n@import typography';
    const result = scanCssAtImport(text, 0, true);

    expect(result.raw).toBe('reset');
    expect(result.nextIndex).toBe(13);
  });

  it.each([
    {
      expectedRaw: 'unclosed',
      name: 'unclosed quote at newline',
      text: '@import "unclosed\n',
    },
    {
      expectedRaw: 'trailing',
      name: 'trailing backslash',
      text: '@import "trailing\\',
    },
    {
      expectedRaw: 'foo"bar.css',
      name: 'escaped quote',
      text: '@import "foo\\"bar.css";',
    },
  ])('handles $name correctly', ({ expectedRaw, text }) => {
    const result = scanCssAtImport(text, 0, false);

    expect(result.raw).toBe(expectedRaw);
  });
});

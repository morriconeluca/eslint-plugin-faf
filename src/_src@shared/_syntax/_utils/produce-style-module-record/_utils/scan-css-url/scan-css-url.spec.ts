import { describe, expect, it } from 'vitest';

import {
  IDENTIFIER_CHAR_PATTERN,
  URL_HEADER_PATTERN,
} from './scan-css-url.constant.js';
import { scanCssUrl } from './scan-css-url.util.js';

describe('scanCssUrl', () => {
  describe('constants', () => {
    it('matches valid single identifier characters and rejects multi-character', () => {
      expect(IDENTIFIER_CHAR_PATTERN.test('a')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('Z')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('9')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('-')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('_')).toBe(true);
      expect(IDENTIFIER_CHAR_PATTERN.test('ab')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test('a!')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test('!a')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test('')).toBe(false);
      expect(IDENTIFIER_CHAR_PATTERN.test(' ')).toBe(false);
    });

    it('matches url header pattern with various whitespaces', () => {
      URL_HEADER_PATTERN.lastIndex = 0;
      expect(URL_HEADER_PATTERN.test('url(')).toBe(true);

      URL_HEADER_PATTERN.lastIndex = 0;
      expect(URL_HEADER_PATTERN.test('URL  (\n\t')).toBe(true);

      URL_HEADER_PATTERN.lastIndex = 0;
      expect(URL_HEADER_PATTERN.test('curl(')).toBe(false);
    });
  });
  it.each([
    {
      name: 'preceded by letter',
      startIndex: 1,
      text: 'curl(image.png)',
    },
    {
      name: 'preceded by underscore',
      startIndex: 1,
      text: '_url(image.png)',
    },
    {
      name: 'preceded by hyphen',
      startIndex: 1,
      text: '-url(image.png)',
    },
    {
      name: 'preceded by digit',
      startIndex: 1,
      text: '0url(image.png)',
    },
    {
      name: 'token is not url',
      startIndex: 0,
      text: 'var(--main-color)',
    },
    {
      name: 'url is not followed by opening parenthesis',
      startIndex: 0,
      text: 'url = "not a function"',
    },
    {
      name: 'url is at EOF',
      startIndex: 0,
      text: 'url',
    },
  ])('returns empty result when $name', ({ startIndex, text }) => {
    const result = scanCssUrl(text, startIndex);

    expect(result.raw).toBeUndefined();
    expect(result.nextIndex).toBe(startIndex);
  });

  it.each([
    {
      expectedRaw: 'images/logo.png',
      name: 'double-quoted',
      text: 'background: url("images/logo.png");',
    },
    {
      expectedRaw: 'images/logo.png',
      name: 'single-quoted',
      text: "background: url('images/logo.png');",
    },
    {
      expectedRaw: 'images/logo.png',
      name: 'unquoted',
      text: 'background: url(images/logo.png);',
    },
    {
      expectedRaw: 'var(--custom-image)',
      name: 'nested-parens',
      text: 'background: url(var(--custom-image));',
    },
  ])('scans $name url correctly', ({ expectedRaw, text }) => {
    const result = scanCssUrl(text, 12);

    expect(result.raw).toBe(expectedRaw);
    expect(result.nextIndex).toBeGreaterThan(12);
  });

  it('scans empty url()', () => {
    const text = 'background: url();';
    const result = scanCssUrl(text, 12);

    expect(result.raw).toBe('');
    expect(result.nextIndex).toBe(17);
  });

  it('handles url with leading and trailing whitespace inside parentheses', () => {
    const text = 'background: url(   "fonts/font.woff2"   );';
    const result = scanCssUrl(text, 12);

    expect(result.raw).toBe('fonts/font.woff2');
  });

  it.each([
    {
      expectedRaw: 'escaped"quote.png',
      name: 'escaped-quote',
      text: 'url("escaped\\"quote.png")',
    },
    {
      expectedRaw: 'unclosed',
      name: 'unclosed-at-newline',
      text: 'url("unclosed\n',
    },
    {
      expectedRaw: 'trailing',
      name: 'trailing-backslash',
      text: 'url("trailing\\',
    },
  ])('handles $name within quoted url', ({ expectedRaw, text }) => {
    const result = scanCssUrl(text, 0);

    expect(result.raw).toBe(expectedRaw);
  });
});

import { describe, expect, it } from 'vitest';

import { DELIMITER_CHARS } from './read-bare-specifier.constant.js';
import { readBareSpecifier } from './read-bare-specifier.util.js';

describe('readBareSpecifier', () => {
  it('defines exact delimiter characters', () => {
    expect(DELIMITER_CHARS).toEqual([';', '}', ' ', '\t', '\n', '\r']);
  });
  it.each([
    {
      expectedIndex: 5,
      expectedRaw: 'reset',
      name: 'semicolon delimiter',
      text: 'reset;',
    },
    {
      expectedIndex: 5,
      expectedRaw: 'reset',
      name: 'space delimiter',
      text: 'reset next',
    },
    {
      expectedIndex: 5,
      expectedRaw: 'reset',
      name: 'tab delimiter',
      text: 'reset\tnext',
    },
    {
      expectedIndex: 5,
      expectedRaw: 'reset',
      name: 'closing brace delimiter',
      text: 'reset}next',
    },
    {
      expectedIndex: 10,
      expectedRaw: 'typography',
      name: 'LF newline delimiter',
      text: 'typography\nnext',
    },
    {
      expectedIndex: 10,
      expectedRaw: 'typography',
      name: 'CR newline delimiter',
      text: 'typography\rnext',
    },
    {
      expectedIndex: 19,
      expectedRaw: '#{$theme}/style.css',
      name: 'interpolation expression with braces',
      text: '#{$theme}/style.css;',
    },
    {
      expectedIndex: 25,
      expectedRaw: '#{$theme#{sub}}/style.css',
      name: 'nested braces in interpolation',
      text: '#{$theme#{sub}}/style.css;',
    },
    {
      expectedIndex: 8,
      expectedRaw: '#{$theme',
      name: 'unclosed brace at EOF',
      text: '#{$theme',
    },
  ])(
    'reads specifier terminated by $name',
    ({ expectedIndex, expectedRaw, text }) => {
      const result = readBareSpecifier(text, 0);

      expect(result.raw).toBe(expectedRaw);
      expect(result.nextIndex).toBe(expectedIndex);
    }
  );
});

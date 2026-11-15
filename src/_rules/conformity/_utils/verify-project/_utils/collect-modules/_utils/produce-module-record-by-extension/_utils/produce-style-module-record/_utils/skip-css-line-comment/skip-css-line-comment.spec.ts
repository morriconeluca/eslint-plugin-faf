import { describe, expect, it } from 'vitest';

import { skipCssLineComment } from './skip-css-line-comment.util.js';

describe('skipCssLineComment', () => {
  it.each([
    {
      name: 'current character is not double slash',
      text: 'div { color: red; }',
    },
    {
      name: 'slash is followed by asterisk',
      text: '/* not a line comment */',
    },
  ])('returns skipped false when $name', ({ text }) => {
    const result = skipCssLineComment(text, 0);

    expect(result.skipped).toBe(false);
    expect(result.nextIndex).toBe(0);
  });

  it('skips single line comments with trailing newline', () => {
    const text = '// single line comment\nnext';
    const result = skipCssLineComment(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(23);
  });

  it('skips single line comments reaching EOF without trailing newline', () => {
    const text = '// trailing comment at eof';
    const result = skipCssLineComment(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(text.length);
  });
});

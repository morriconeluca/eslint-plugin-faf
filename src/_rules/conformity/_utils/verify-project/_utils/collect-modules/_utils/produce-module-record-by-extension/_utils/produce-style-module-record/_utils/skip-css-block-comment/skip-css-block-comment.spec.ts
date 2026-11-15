import { describe, expect, it } from 'vitest';

import { skipCssBlockComment } from './skip-css-block-comment.util.js';

describe('skipCssBlockComment', () => {
  it.each([
    {
      name: 'current character is not slash asterisk',
      text: 'body { color: red; }',
    },
    {
      name: 'slash is followed by slash or other char',
      text: '// not a block comment',
    },
  ])('returns skipped false when $name', ({ text }) => {
    const result = skipCssBlockComment(text, 0);

    expect(result.skipped).toBe(false);
    expect(result.nextIndex).toBe(0);
  });

  it('skips block comments properly', () => {
    const text = '/* comment */ body';
    const result = skipCssBlockComment(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(13);
  });

  it('skips unclosed block comments reaching EOF', () => {
    const text = '/* unclosed comment';
    const result = skipCssBlockComment(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(text.length);
  });
});

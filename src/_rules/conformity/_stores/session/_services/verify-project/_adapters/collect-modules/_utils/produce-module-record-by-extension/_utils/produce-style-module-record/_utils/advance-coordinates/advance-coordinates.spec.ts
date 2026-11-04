import { describe, expect, it } from 'vitest';

import { advanceCoordinates } from './advance-coordinates.util.js';

describe('advanceCoordinates', () => {
  it('advances column without changing line when text has no line breaks', () => {
    const text = 'hello world';
    const result = advanceCoordinates(text, 0, 5, 1, 1);

    expect(result.line).toBe(1);
    expect(result.column).toBe(6);
  });

  it.each([
    {
      expectedColumn: 6,
      expectedLine: 2,
      name: 'LF',
      text: 'line1\nline2',
    },
    {
      expectedColumn: 6,
      expectedLine: 2,
      name: 'CRLF',
      text: 'line1\r\nline2',
    },
    {
      expectedColumn: 6,
      expectedLine: 2,
      name: 'CR',
      text: 'line1\rline2',
    },
  ])(
    'advances line and resets column on $name line breaks',
    ({ expectedColumn, expectedLine, text }) => {
      const result = advanceCoordinates(text, 0, text.length, 1, 1);

      expect(result.line).toBe(expectedLine);
      expect(result.column).toBe(expectedColumn);
    }
  );

  it('handles multiple newlines and tracks final line and column correctly', () => {
    const text = 'a\nb\nc\nd';
    const result = advanceCoordinates(text, 0, text.length, 1, 1);

    expect(result.line).toBe(4);
    expect(result.column).toBe(2);
  });
});

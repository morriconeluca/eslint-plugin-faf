import { describe, expect, it } from 'vitest';

import { collectStringDuplicates } from './collect-string-duplicates.schema.js';

describe('collectStringDuplicates', () => {
  it('reports only a repeated non-empty string and ignores repeated empty strings or non-strings', () => {
    const outcomes = collectStringDuplicates(
      ['src', '', '', 1, 1, 'src'],
      new Set<string>(),
      (index) => `list[${index}]`,
      'configuration/duplicate-element'
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.propertyPath).toBe('list[5]');
    expect(outcomes[0]?.message).toBe("'list[5]' is a duplicate element");
  });
});

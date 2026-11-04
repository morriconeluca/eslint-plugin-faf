import { describe, expect, it } from 'vitest';

import { collectStringDuplicates } from './collect-string-duplicates.schema.js';

describe('collectStringDuplicates', () => {
  it('reports only a repeated non-empty string', () => {
    const outcomes = collectStringDuplicates(
      ['src', '', 1, 'src'],
      new Set<string>(),
      (index) => `list[${index}]`,
      (value) => `Duplicate "${value}".`,
      'CONFIG_2',
      'configuration/duplicate-element'
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.propertyPath).toBe('list[3]');
    expect(outcomes[0]?.message).toBe('Duplicate "src".');
  });
});

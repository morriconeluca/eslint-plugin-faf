import { describe, expect, it } from 'vitest';

import { fileStem } from './file-stem.util.js';

describe('fileStem', () => {
  it('derives the stem before the first dot and keeps names without one', () => {
    expect(fileStem('button.component.tsx')).toBe('button');
    expect(fileStem('README')).toBe('README');
    expect(fileStem('.hidden')).toBe('.hidden');
  });
});

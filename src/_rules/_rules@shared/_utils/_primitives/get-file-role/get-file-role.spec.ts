import { describe, expect, it } from 'vitest';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { getFileRole } from './get-file-role.util.js';

describe('getFileRole', () => {
  const config: TTreeConfig = {
    includes: ['src'],
    roles: [['type'], ['util'], ['rule'], ['index', 'spec']],
  };

  it('should identify role of file', () => {
    expect(getFileRole('foo.util.ts', config)).toBe('util');
    expect(getFileRole('foo.spec.ts', config)).toBe('spec');
  });

  it('should return index for index files', () => {
    expect(getFileRole('index.ts', config)).toBe('index');
  });

  it('should return null if no role is matched', () => {
    expect(getFileRole('foo.unknown.ts', config)).toBeNull();
  });
});

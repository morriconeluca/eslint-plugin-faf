import { describe, expect, it } from 'vitest';

import { calculateContentKey } from './calculate-content-key.util.js';

describe('calculateContentKey', () => {
  it('returns the schema-bound digest of the normalized path and text', () => {
    const key = calculateContentKey('src/main.ts', 'const x = 1;');
    expect(key).toBe(
      '45e10a6ffd1de9a2be5bbaf9a3380541af650b04494d78a8fc8bf28bbc87a418'
    );
    expect(calculateContentKey('src/main.ts', 'const x = 1;')).toBe(key);
  });

  it('produces different hashes for different text', () => {
    const key1 = calculateContentKey('src/main.ts', 'const x = 1;');
    const key2 = calculateContentKey('src/main.ts', 'const x = 2;');
    expect(key1).not.toBe(key2);
  });

  it('produces different hashes for different paths with same text', () => {
    const key1 = calculateContentKey('src/a.ts', 'const x = 1;');
    const key2 = calculateContentKey('src/b.ts', 'const x = 1;');
    expect(key1).not.toBe(key2);
  });

  it('normalizes windows backslashes to match posix forward slashes', () => {
    const posixKey = calculateContentKey('src/nested/file.ts', 'const a = 1;');
    const winKey = calculateContentKey('src\\nested\\file.ts', 'const a = 1;');
    expect(winKey).toBe(posixKey);
  });

  it('separates path and text so adjacent boundaries do not alias', () => {
    expect(calculateContentKey('ab', 'c')).not.toBe(
      calculateContentKey('a', 'bc')
    );
  });
});

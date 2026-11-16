import { describe, expect, it } from 'vitest';

import { toPosixPath } from './to-posix-path.util.js';

describe('toPosixPath', () => {
  it('converts Windows backslashes to forward slashes', () => {
    expect(toPosixPath('src\\components\\button.ts')).toBe(
      'src/components/button.ts'
    );
  });

  it('converts multiple and consecutive backslashes', () => {
    expect(toPosixPath('src\\\\components\\\\button.ts')).toBe(
      'src//components//button.ts'
    );
    expect(toPosixPath('\\root\\nested\\file.ts\\')).toBe(
      '/root/nested/file.ts/'
    );
  });

  it('converts mixed slashes to forward slashes', () => {
    expect(toPosixPath('src/components\\button/index.ts')).toBe(
      'src/components/button/index.ts'
    );
  });

  it('leaves standard POSIX paths unchanged', () => {
    expect(toPosixPath('src/components/button.ts')).toBe(
      'src/components/button.ts'
    );
  });

  it('handles empty strings and single slash characters', () => {
    expect(toPosixPath('')).toBe('');
    expect(toPosixPath('\\')).toBe('/');
    expect(toPosixPath('/')).toBe('/');
  });
});

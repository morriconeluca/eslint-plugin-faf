import { describe, expect, it } from 'vitest';

import { toRelativeRealPath } from './to-relative-real-path.util.js';

describe('toRelativeRealPath', () => {
  it('returns relative path when target is inside base directory', () => {
    expect(
      toRelativeRealPath('/workspace/project/src/main.ts', '/workspace/project')
    ).toBe('src/main.ts');
  });

  it('returns dot when target path exactly matches base directory', () => {
    expect(toRelativeRealPath('/workspace/project', '/workspace/project')).toBe(
      '.'
    );
  });

  it('returns canonical absolute path when target is outside base directory', () => {
    expect(
      toRelativeRealPath('/outside/folder/lib.ts', '/workspace/project')
    ).toBe('/outside/folder/lib.ts');
  });

  it('normalizes Windows backslashes to POSIX forward slashes', () => {
    expect(toRelativeRealPath('C:\\project\\src\\file.ts', 'C:\\project')).toBe(
      'src/file.ts'
    );
  });
});

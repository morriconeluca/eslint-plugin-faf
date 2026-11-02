import { describe, expect, it } from 'vitest';

import { resolveTreeOrigin } from './index.js';

describe('resolveTreeOrigin', () => {
  it('returns null when origins list is empty', () => {
    expect(resolveTreeOrigin('src/index.ts', [])).toBeNull();
  });

  it('returns origin when entryPath exactly matches origin', () => {
    expect(resolveTreeOrigin('src', ['src', 'lib'])).toBe('src');
  });

  it('returns origin when entryPath is inside origin directory', () => {
    expect(resolveTreeOrigin('src/components/button.tsx', ['src'])).toBe('src');
  });

  it('does not match entryPath that shares prefix but not path segment', () => {
    expect(resolveTreeOrigin('src2/index.ts', ['src'])).toBeNull();
  });

  it('returns null when entryPath is outside all declared origins', () => {
    expect(resolveTreeOrigin('scripts/build.ts', ['src', 'lib'])).toBeNull();
  });

  it('matches dot root origin for arbitrary paths', () => {
    expect(resolveTreeOrigin('anything/deep/file.ts', ['.'])).toBe('.');
  });

  it('picks longer matching origin when multiple origins overlap', () => {
    expect(resolveTreeOrigin('apps/blog/post.ts', ['apps', 'apps/blog'])).toBe(
      'apps/blog'
    );
  });

  it('keeps previously matched longer origin when a shorter origin follows', () => {
    expect(resolveTreeOrigin('apps/blog/post.ts', ['apps/blog', 'apps'])).toBe(
      'apps/blog'
    );
  });
});

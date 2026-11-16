import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { filterExternalOverlayPaths } from './filter-external-overlay-paths.util.js';

describe('filterExternalOverlayPaths', () => {
  const baseDirectory = nodePath.resolve('/workspace');

  it('returns empty array when overlayPaths is undefined or dot is a declared origin', () => {
    expect(
      filterExternalOverlayPaths(baseDirectory, new Set(['src']), undefined)
    ).toEqual([]);
    expect(
      filterExternalOverlayPaths(baseDirectory, new Set(['.']), [
        'build/output.ts',
      ])
    ).toEqual([]);
  });

  it('keeps only lintable files strictly inside baseDirectory, excluding faf.config.ts and tree origins', () => {
    const result = filterExternalOverlayPaths(
      baseDirectory,
      new Set(['packages/core', 'src']),
      [
        '.',
        '..',
        '../outside.ts',
        'faf.config.ts',
        'README.md',
        'src',
        'src/internal.ts',
        'packages/core/index.ts',
        'src2/external.ts',
        'dist/bundle.js',
        './build/output.ts',
        '.git/hook.ts',
      ]
    );

    expect(result).toEqual([
      '.git/hook.ts',
      'build/output.ts',
      'dist/bundle.js',
      'src2/external.ts',
    ]);
  });
});

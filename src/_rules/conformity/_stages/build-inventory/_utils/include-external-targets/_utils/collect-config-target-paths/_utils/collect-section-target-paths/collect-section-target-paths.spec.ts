import { describe, expect, it } from 'vitest';

import { collectSectionTargetPaths } from './collect-section-target-paths.util.js';

describe('collectSectionTargetPaths', () => {
  it('returns an empty list when all reference arrays are omitted', () => {
    expect(collectSectionTargetPaths({})).toEqual([]);
  });

  it('collects paths from foreignDomains, foreignNodes, mimeticPathStructures, publicRootNodes, and externalDependencies', () => {
    expect(
      collectSectionTargetPaths({
        externalDependencies: [
          {
            from: ['src/main.ts', 'src/app.ts'],
            to: ['legacy/client.ts', 'package.json'],
          },
        ],
        foreignDomains: ['scripts', 'docs'],
        foreignNodes: [
          'README.md',
          {
            paths: ['.', 'tools'],
            patterns: ['*.md'],
          },
        ],
        mimeticPathStructures: [
          {
            actions: ['get'],
            paths: ['src/_apis', 'outside/_apis'],
          },
        ],
        publicRootNodes: ['src/main.ts', 'outside.ts'],
      })
    ).toEqual([
      'scripts',
      'docs',
      'src/main.ts',
      'outside.ts',
      'README.md',
      '.',
      'tools',
      'src/_apis',
      'outside/_apis',
      'src/main.ts',
      'src/app.ts',
      'legacy/client.ts',
      'package.json',
    ]);
  });
});

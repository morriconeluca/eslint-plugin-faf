import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../_src@shared/_types/faf-config.type.js';

import { collectConfigTargetPaths } from './collect-config-target-paths.util.js';

describe('collectConfigTargetPaths', () => {
  it('returns an empty list when common and optional local fields are omitted', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [{ rootLayers: ['src'] }],
      },
    };
    expect(collectConfigTargetPaths(config)).toEqual([]);
  });

  it('collects all literal referenced paths across common, aliases, locals, and horizontalHierarchies', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          aliases: {
            '#outside': 'outside',
            '#shared': 'src/_src@shared',
          },
          externalDependencies: [{ from: ['src/a.ts'], to: ['common-ext.ts'] }],
          foreignDomains: ['common-scripts'],
          foreignNodes: ['COMMON.md', { paths: ['.'], patterns: ['*.md'] }],
          mimeticPathStructures: [{ paths: ['src/_apis'] }],
          publicRootNodes: ['common-public.ts'],
        },
        locals: [
          {
            externalDependencies: [
              { from: ['src/b.ts'], to: ['local-ext.ts'] },
            ],
            foreignDomains: ['scripts'],
            foreignNodes: [
              'README.md',
              { paths: ['tools'], patterns: ['*.md'] },
            ],
            horizontalHierarchies: [
              { hierarchy: [['_a'], ['_b']], path: 'outside-dir' },
            ],
            mimeticPathStructures: [{ paths: ['outside-apis'] }],
            publicRootNodes: ['local-public.ts'],
            rootLayers: ['src'],
          },
        ],
      },
    };

    expect(collectConfigTargetPaths(config)).toEqual([
      'common-scripts',
      'common-public.ts',
      'COMMON.md',
      '.',
      'src/_apis',
      'src/a.ts',
      'common-ext.ts',
      'outside',
      'src/_src@shared',
      'scripts',
      'local-public.ts',
      'README.md',
      'tools',
      'outside-apis',
      'src/b.ts',
      'local-ext.ts',
      'outside-dir',
    ]);
  });

  it('handles common section when common.aliases is omitted', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          foreignDomains: ['docs'],
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };
    expect(collectConfigTargetPaths(config)).toEqual(['docs']);
  });
});

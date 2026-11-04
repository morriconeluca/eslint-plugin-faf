import { describe, expect, it } from 'vitest';

import type { TFAFLocalConfig } from '../../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';

import { hasOnlyRootLayers } from './has-only-root-layers.util.js';

describe('hasOnlyRootLayers', () => {
  it('is true only when root layers are present and root fragments are absent or empty', () => {
    const layersOnly = { rootLayers: ['src'] } satisfies TFAFLocalConfig;
    const both = {
      rootFragments: [{ path: 'app', rootNodes: [] }],
      rootLayers: ['src'],
    } satisfies TFAFLocalConfig;
    const fragmentsOnly = {
      rootFragments: [{ path: 'app', rootNodes: [] }],
    } satisfies TFAFLocalConfig;
    const emptyFragments = {
      rootFragments: [],
      rootLayers: ['src'],
    } satisfies TFAFLocalConfig;
    expect(hasOnlyRootLayers(layersOnly)).toBe(true);
    expect(hasOnlyRootLayers(both)).toBe(false);
    expect(hasOnlyRootLayers(fragmentsOnly)).toBe(false);
    expect(hasOnlyRootLayers(emptyFragments)).toBe(true);
  });
});

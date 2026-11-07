import { describe, expect, it } from 'vitest';

import { flattenRootFragments } from './index.js';

describe('flattenRootFragments', () => {
  it('flattens nested root fragments', () => {
    const flattened = flattenRootFragments([
      {
        dependencyPairs: [],
        path: 'src',
        rootNodes: [],
        subRootFragments: [
          {
            dependencyPairs: [],
            path: 'src/a',
            rootNodes: [],
            subRootFragments: [],
          },
        ],
      },
    ]);
    expect(flattened).toHaveLength(2);
  });

  it('handles empty input array', () => {
    expect(flattenRootFragments([])).toEqual([]);
  });
});

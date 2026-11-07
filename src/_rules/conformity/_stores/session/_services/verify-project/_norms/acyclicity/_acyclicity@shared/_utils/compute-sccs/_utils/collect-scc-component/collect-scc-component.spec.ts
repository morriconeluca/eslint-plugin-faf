import { describe, expect, it } from 'vitest';

import { collectSccComponent } from './collect-scc-component.util.js';

describe('collectSccComponent', () => {
  it('collects component vertices', () => {
    const visited = new Uint8Array(2);
    expect(collectSccComponent(0, [[1], []], visited)).toEqual([0, 1]);
  });

  it('skips already visited neighbors and handles missing row', () => {
    const visited = new Uint8Array([1, 1]);
    expect(collectSccComponent(0, [[1], []], visited)).toEqual([0]);
    expect(collectSccComponent(1, [[]], new Uint8Array(2))).toEqual([1]);
  });
});

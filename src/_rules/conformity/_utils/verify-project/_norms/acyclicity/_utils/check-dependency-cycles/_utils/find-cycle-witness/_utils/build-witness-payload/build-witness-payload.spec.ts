import { describe, expect, it } from 'vitest';

import { buildWitnessPayload } from './build-witness-payload.util.js';

describe('buildWitnessPayload', () => {
  it('extracts element and secondNode from witness', () => {
    expect(buildWitnessPayload(['a', 'b'])).toEqual({
      element: 'a',
      secondNode: 'b',
      witness: ['a', 'b'],
    });
  });

  it('handles empty witness fallback', () => {
    expect(buildWitnessPayload([])).toEqual({
      element: '',
      secondNode: '',
      witness: [],
    });
  });
});

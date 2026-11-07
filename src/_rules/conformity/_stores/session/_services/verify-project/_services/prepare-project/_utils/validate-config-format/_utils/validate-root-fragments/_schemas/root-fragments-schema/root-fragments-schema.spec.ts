import { describe, expect, it } from 'vitest';

import { rootFragmentsSchema } from './root-fragments-schema.schema.js';

describe('rootFragmentsSchema', () => {
  it('accepts a fragment and rejects null', () => {
    expect(
      rootFragmentsSchema.safeParse([{ path: 'src', rootNodes: [] }]).success
    ).toBe(true);
    expect(rootFragmentsSchema.safeParse(null).success).toBe(false);
  });
});

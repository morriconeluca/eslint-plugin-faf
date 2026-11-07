import { describe, expect, it } from 'vitest';

import { workerMessageSchema } from './worker-message-schema.schema.js';

describe('workerMessageSchema', () => {
  it('accepts a kind record and rejects an array', () => {
    expect(workerMessageSchema.safeParse({ kind: 'missing' }).success).toBe(
      true
    );
    expect(workerMessageSchema.safeParse(['kind']).success).toBe(false);
  });
});

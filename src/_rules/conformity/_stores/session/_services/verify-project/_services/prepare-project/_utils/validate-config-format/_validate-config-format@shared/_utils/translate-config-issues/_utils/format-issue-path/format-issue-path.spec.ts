import { describe, expect, it } from 'vitest';

import { formatIssuePath } from './format-issue-path.util.js';

describe('formatIssuePath', () => {
  it('formats object keys and array indexes', () => {
    expect(formatIssuePath(['faf', 'locals', 0, 'rootNodes', 2])).toBe(
      'faf.locals[0].rootNodes[2]'
    );
  });
});

import { describe, expect, it } from 'vitest';

import { state } from '#_utils@shared/_stores/cache/index.js';

import { toRelativePath } from './to-relative-path.util.js';

describe('toRelativePath', () => {
  it('should format absolute path to relative with forward slashes', () => {
    state.projectRoot = '/project';
    const rel = toRelativePath('/project/src/foo\\bar');
    expect(rel).toBe('src/foo/bar');
  });
});

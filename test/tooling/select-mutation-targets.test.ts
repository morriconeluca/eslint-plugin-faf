import { createFixture } from 'fs-fixture';
import { describe, expect, it } from 'vitest';

import {
  listAllMutableSources,
  selectMutationTargets,
} from '../../scripts/mutate-diff.js';

describe('selectMutationTargets', () => {
  it('mutates directory sources when only the spec changed', () => {
    expect(
      selectMutationTargets(
        ['src/foo/bar.spec.ts'],
        [
          'src/foo/bar.mock.ts',
          'src/foo/bar.spec.ts',
          'src/foo/bar.util.ts',
          'src/foo/index.ts',
          'src/foo/nested/other.util.ts',
        ]
      )
    ).toEqual(['src/foo/bar.util.ts']);
  });

  it('mutates every source in a directory when one source changed', () => {
    expect(
      selectMutationTargets(
        ['src/foo/bar.util.ts'],
        [
          'src/foo/bar.util.ts',
          'src/foo/other.util.ts',
          'src/foo/other.spec.ts',
        ]
      )
    ).toEqual(['src/foo/bar.util.ts', 'src/foo/other.util.ts']);
  });

  it('mutates directory sources when only a type file changed', () => {
    expect(
      selectMutationTargets(
        ['src/foo/bar.type.ts'],
        ['src/foo/bar.type.ts', 'src/foo/bar.util.ts']
      )
    ).toEqual(['src/foo/bar.util.ts']);
  });

  it('includes untracked files that are present on disk', () => {
    expect(
      selectMutationTargets(
        ['src/foo/new.util.ts'],
        ['src/foo/new.util.ts', 'src/foo/old.util.ts']
      )
    ).toEqual(['src/foo/new.util.ts', 'src/foo/old.util.ts']);
  });

  it('ignores deleted files that are no longer present', () => {
    expect(
      selectMutationTargets(
        ['src/foo/deleted.util.ts'],
        ['src/foo/kept.util.ts']
      )
    ).toEqual([]);
  });

  it('ignores files outside src', () => {
    expect(
      selectMutationTargets(
        ['scripts/mutate-diff.ts', 'test/tooling/example.test.ts'],
        [
          'scripts/mutate-diff.ts',
          'src/foo/bar.util.ts',
          'test/tooling/example.test.ts',
        ]
      )
    ).toEqual([]);
  });

  it('returns no targets when a directory contains only excluded files', () => {
    expect(
      selectMutationTargets(
        ['src/foo/only.spec.ts'],
        [
          'src/foo/index.ts',
          'src/foo/only.mock.ts',
          'src/foo/only.spec.ts',
          'src/foo/only.type.ts',
        ]
      )
    ).toEqual([]);
  });

  it('includes index.ts in listAllMutableSources for full runs while diff excludes index.ts', async () => {
    const fixture = await createFixture({
      'src/foo/bar.mock.ts': 'export const mock = 1;\n',
      'src/foo/bar.spec.ts': 'export const spec = 1;\n',
      'src/foo/bar.type.ts': 'export type T = number;\n',
      'src/foo/bar.util.ts': 'export const bar = () => 1;\n',
      'src/foo/index.ts': 'export * from "./bar.util.js";\n',
      'src/index.ts': 'export * from "./foo/index.js";\n',
    });
    try {
      const fullSources = listAllMutableSources(fixture.path);
      expect(fullSources).toContain('src/index.ts');
      expect(fullSources).toContain('src/foo/index.ts');
      expect(fullSources).toContain('src/foo/bar.util.ts');
      expect(fullSources).not.toContain('src/foo/bar.mock.ts');
      expect(fullSources).not.toContain('src/foo/bar.spec.ts');
      expect(fullSources).not.toContain('src/foo/bar.type.ts');
    } finally {
      await fixture.rm();
    }
  });
});

import { describe, expect, it } from 'vitest';

import { createForeignPathMatcher } from './create-foreign-path-matcher.util.js';

describe('createForeignPathMatcher', () => {
  it('matches single globstar against any non-empty relative path', () => {
    const hasMatch = createForeignPathMatcher('**');
    expect(hasMatch('README.md')).toBe(true);
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('a/b/c/d.ts')).toBe(true);
    expect(hasMatch('')).toBe(false);
  });

  it('deduplicates multiple consecutive globstars', () => {
    const hasMatch = createForeignPathMatcher('**/**/**/*.md');
    expect(hasMatch('README.md')).toBe(true);
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('docs/a.ts')).toBe(false);

    const hasAllMatch = createForeignPathMatcher('**/**/**');
    expect(hasAllMatch('README.md')).toBe(true);
    expect(hasAllMatch('docs/nested/file.txt')).toBe(true);
  });

  it('matches leading globstar against shallow and deep paths', () => {
    const hasMatch = createForeignPathMatcher('**/*.md');
    expect(hasMatch('README.md')).toBe(true);
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('deep/nested/path/b.md')).toBe(true);
    expect(hasMatch('README.ts')).toBe(false);

    const hasExactTarget = createForeignPathMatcher('**/target.md');
    expect(hasExactTarget('target.md')).toBe(true);
    expect(hasExactTarget('dir/target.md')).toBe(true);
    expect(hasExactTarget('prefixtarget.md')).toBe(false);
    expect(hasExactTarget('dir/prefixtarget.md')).toBe(false);
  });

  it('matches trailing globstar', () => {
    const hasMatch = createForeignPathMatcher('docs/**');
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('docs/deep/nested/b.ts')).toBe(true);
    expect(hasMatch('other/a.md')).toBe(false);
  });

  it('matches intermediate globstar across zero or multiple directories', () => {
    const hasMatch = createForeignPathMatcher('docs/**/*.md');
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('docs/deep/a.md')).toBe(true);
    expect(hasMatch('docs/deep/very/deep/a.md')).toBe(true);
    expect(hasMatch('other/a.md')).toBe(false);
    expect(hasMatch('docs/a.ts')).toBe(false);

    const hasBothGlobstars = createForeignPathMatcher('**/docs/**');
    expect(hasBothGlobstars('foo/docs/bar.ts')).toBe(true);
    expect(hasBothGlobstars('docs/bar.ts')).toBe(true);
    expect(hasBothGlobstars('foo/other/bar.ts')).toBe(false);
  });

  it('matches single segment without globstar strictly within that directory', () => {
    const hasMatch = createForeignPathMatcher('docs/*.md');
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('docs/deep/a.md')).toBe(false);
    expect(hasMatch('src/a.md')).toBe(false);
  });

  it('matches multiple normal segments without globstar', () => {
    const hasMatch = createForeignPathMatcher('src/domain/types.ts');
    expect(hasMatch('src/domain/types.ts')).toBe(true);
    expect(hasMatch('src/domain/other.ts')).toBe(false);
    expect(hasMatch('other/domain/types.ts')).toBe(false);
  });

  it('handles question mark within path segment including unicode', () => {
    const hasMatch = createForeignPathMatcher('docs/?.md');
    expect(hasMatch('docs/a.md')).toBe(true);
    expect(hasMatch('docs/😀.md')).toBe(true);
    expect(hasMatch('docs/ab.md')).toBe(false);
  });

  it('handles literal brackets and special characters in path segments', () => {
    const hasMatch = createForeignPathMatcher('_[todo-id]/*.md');
    expect(hasMatch('_[todo-id]/README.md')).toBe(true);
    expect(hasMatch('_[todo-id]/deep/README.md')).toBe(false);
    expect(hasMatch('_todo-id/README.md')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { createForeignFileNameMatcher } from './create-foreign-file-name-matcher.util.js';

describe('createForeignFileNameMatcher', () => {
  it('matches file name with wildcard against root and nested paths', () => {
    const hasMatch = createForeignFileNameMatcher('*.md');
    expect(hasMatch('README.md')).toBe(true);
    expect(hasMatch('app/README.md')).toBe(true);
    expect(hasMatch('.notes.md')).toBe(true);
    expect(hasMatch('.md')).toBe(true);
    expect(hasMatch('deep/nested/path/document.md')).toBe(true);
  });

  it('rejects files not matching extension or pattern', () => {
    const hasMatch = createForeignFileNameMatcher('*.md');
    expect(hasMatch('README.MD')).toBe(false);
    expect(hasMatch('index.ts')).toBe(false);
    expect(hasMatch('app/index.ts')).toBe(false);
  });

  it('matches single-character wildcard including unicode code points', () => {
    const hasMatch = createForeignFileNameMatcher('?.md');
    expect(hasMatch('a.md')).toBe(true);
    expect(hasMatch('z.md')).toBe(true);
    expect(hasMatch('nested/b.md')).toBe(true);
    expect(hasMatch('😀.md')).toBe(true);
    expect(hasMatch('ab.md')).toBe(false);
    expect(hasMatch('.md')).toBe(false);
  });

  it('treats square brackets and other special regex characters literally', () => {
    const hasMatch = createForeignFileNameMatcher('report[1].md');
    expect(hasMatch('report[1].md')).toBe(true);
    expect(hasMatch('deep/report[1].md')).toBe(true);
    expect(hasMatch('report1.md')).toBe(false);
    expect(hasMatch('report[2].md')).toBe(false);
  });

  it('matches multi-dot extensions correctly', () => {
    const hasMatch = createForeignFileNameMatcher('*.d.ts');
    expect(hasMatch('types/globals.d.ts')).toBe(true);
    expect(hasMatch('globals.d.ts')).toBe(true);
    expect(hasMatch('globals.ts')).toBe(false);
  });
});

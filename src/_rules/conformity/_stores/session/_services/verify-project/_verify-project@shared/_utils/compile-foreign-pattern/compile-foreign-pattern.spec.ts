import { describe, expect, it } from 'vitest';

import type { TForeignPatternRejectReason } from './compile-foreign-pattern.type.js';

import { compileForeignPattern } from './index.js';

describe('compileForeignPattern', () => {
  describe('faf.feature: Applicare i pattern ai file nell ambito src', () => {
    it.each([
      {
        expected: true,
        file: 'README.md',
        pattern: '*.md',
      },
      {
        expected: true,
        file: 'app/README.md',
        pattern: '*.md',
      },
      {
        expected: true,
        file: '.notes.md',
        pattern: '*.md',
      },
      {
        expected: true,
        file: '.md',
        pattern: '*.md',
      },
      {
        expected: false,
        file: 'README.MD',
        pattern: '*.md',
      },
      {
        expected: true,
        file: 'types/globals.d.ts',
        pattern: '*.d.ts',
      },
      {
        expected: true,
        file: 'docs/a.md',
        pattern: 'docs/*.md',
      },
      {
        expected: false,
        file: 'docs/deep/a.md',
        pattern: 'docs/*.md',
      },
      {
        expected: true,
        file: 'README.md',
        pattern: '**/*.md',
      },
      {
        expected: true,
        file: 'docs/a.md',
        pattern: 'docs/**/*.md',
      },
      {
        expected: true,
        file: 'docs/deep/a.md',
        pattern: 'docs/**/*.md',
      },
      {
        expected: true,
        file: 'a.md',
        pattern: '?.md',
      },
      {
        expected: false,
        file: 'ab.md',
        pattern: '?.md',
      },
      {
        expected: true,
        file: 'report[1].md',
        pattern: 'report[1].md',
      },
      {
        expected: false,
        file: 'report1.md',
        pattern: 'report[1].md',
      },
      {
        expected: true,
        file: '_[todo-id]/README.md',
        pattern: '_[todo-id]/*.md',
      },
    ])(
      'matches pattern "$pattern" against "$file" expecting $expected',
      ({ expected, file, pattern }) => {
        const result = compileForeignPattern(pattern);
        expect(result.ok).toBe(true);
        if (!result.ok) {
          return;
        }
        expect(result.matcher(file)).toBe(expected);
      }
    );
  });

  describe('faf.feature: Rifiutare criteri Foreign fuori dalla grammatica documentata', () => {
    it.each<{
      pattern: string;
      reason: TForeignPatternRejectReason;
    }>([
      { pattern: '!*.md', reason: 'negation' },
      { pattern: '*.{ts,js}', reason: 'brace-expansion' },
      { pattern: 'docs/test}', reason: 'brace-expansion' },
      { pattern: '/^.*\\.md$/', reason: 'regular-expression' },
      { pattern: '^.*\\.md$', reason: 'regular-expression' },
      { pattern: '^foo', reason: 'regular-expression' },
      { pattern: '.*\\.md$', reason: 'regular-expression' },
      { pattern: '/.*\\.md/', reason: 'regular-expression' },
      { pattern: '/src/*.md', reason: 'absolute-pattern' },
      { pattern: '/', reason: 'absolute-pattern' },
      { pattern: './*.md', reason: 'dot-segment' },
      { pattern: '../*.md', reason: 'dot-segment' },
      { pattern: 'docs/./*.md', reason: 'dot-segment' },
      { pattern: 'docs/../*.md', reason: 'dot-segment' },
      { pattern: '.', reason: 'dot-segment' },
      { pattern: '..', reason: 'dot-segment' },
    ])(
      'rejects invalid pattern "$pattern" with reason "$reason"',
      ({ pattern, reason }) => {
        expect(compileForeignPattern(pattern)).toEqual({
          ok: false,
          reason,
        });
      }
    );
  });

  describe('additional rejection rules from brief', () => {
    it.each<{
      pattern: string;
      reason: TForeignPatternRejectReason;
    }>([
      { pattern: '', reason: 'empty-pattern' },
      { pattern: 'a**/*.md', reason: 'invalid-globstar' },
      { pattern: '**b/*.md', reason: 'invalid-globstar' },
      { pattern: 'a**b/*.md', reason: 'invalid-globstar' },
      { pattern: '***/*.md', reason: 'invalid-globstar' },
      { pattern: 'docs//*.md', reason: 'empty-segment' },
      { pattern: 'docs/*.md/', reason: 'empty-segment' },
    ])(
      'rejects pattern "$pattern" with reason "$reason"',
      ({ pattern, reason }) => {
        expect(compileForeignPattern(pattern)).toEqual({
          ok: false,
          reason,
        });
      }
    );
  });

  describe('globstar and path grammar extensions', () => {
    it('supports standalone globstar matching any path', () => {
      const result = compileForeignPattern('**');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('README.md')).toBe(true);
      expect(result.matcher('docs/deep/a.md')).toBe(true);
    });

    it('deduplicates consecutive globstar segments', () => {
      const result = compileForeignPattern('**/**');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('README.md')).toBe(true);
      expect(result.matcher('a/b/c.md')).toBe(true);
    });

    it('matches trailing globstar against all descendants', () => {
      const result = compileForeignPattern('docs/**');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('docs/a.md')).toBe(true);
      expect(result.matcher('docs/sub/b.md')).toBe(true);
      expect(result.matcher('docs')).toBe(false);
      expect(result.matcher('other/a.md')).toBe(false);
    });

    it('matches pattern with intermediate globstar with zero directories', () => {
      const result = compileForeignPattern('a/**/c');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('a/c')).toBe(true);
      expect(result.matcher('a/b/c')).toBe(true);
      expect(result.matcher('a/b/d/c')).toBe(true);
    });

    it('enforces exact path boundaries when matching with path slashes', () => {
      const result = compileForeignPattern('docs/*.md');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('other/docs/a.md')).toBe(false);
      expect(result.matcher('docs/a.md.bak')).toBe(false);
    });

    it('handles question mark wildcard inside intermediate path segments', () => {
      const result = compileForeignPattern('docs/?/a.md');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('docs/x/a.md')).toBe(true);
      expect(result.matcher('docs/a.md')).toBe(false);
      expect(result.matcher('docs/xy/a.md')).toBe(false);
    });

    it('matches pattern with multiple globstars at different levels', () => {
      const result = compileForeignPattern('**/docs/**/a.md');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('docs/a.md')).toBe(true);
      expect(result.matcher('sub/docs/a.md')).toBe(true);
      expect(result.matcher('sub/docs/deep/a.md')).toBe(true);
      expect(result.matcher('sub/other/a.md')).toBe(false);
    });

    it('escapes parentheses and plus signs as literal characters in paths', () => {
      const result = compileForeignPattern('(auth)/cpp+/*.md');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('(auth)/cpp+/file.md')).toBe(true);
      expect(result.matcher('auth/cpp/file.md')).toBe(false);
    });

    it('escapes dots in directory names as literal characters', () => {
      const result = compileForeignPattern('v1.0/*.md');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.matcher('v1.0/file.md')).toBe(true);
      expect(result.matcher('v1x0/file.md')).toBe(false);
    });

    it('reuses pre-compiled matcher without re-instantiating regexes', () => {
      const result = compileForeignPattern('docs/*.md');
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      const { matcher } = result;
      expect(matcher('docs/1.md')).toBe(true);
      expect(matcher('docs/2.md')).toBe(true);
      expect(matcher('docs/3.ts')).toBe(false);
    });
  });
});

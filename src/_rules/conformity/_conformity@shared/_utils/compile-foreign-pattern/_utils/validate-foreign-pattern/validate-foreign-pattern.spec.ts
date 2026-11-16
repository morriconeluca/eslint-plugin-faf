import { describe, expect, it } from 'vitest';

import { validateForeignPattern } from './validate-foreign-pattern.util.js';

describe('validateForeignPattern', () => {
  it('returns null for valid foreign patterns without slashes', () => {
    expect(validateForeignPattern('*.md')).toBeNull();
    expect(validateForeignPattern('?.md')).toBeNull();
    expect(validateForeignPattern('report[1].md')).toBeNull();
    expect(validateForeignPattern('foo^bar')).toBeNull();
    expect(validateForeignPattern('foo$bar')).toBeNull();
  });

  it('returns null for valid foreign patterns with slashes', () => {
    expect(validateForeignPattern('docs/*.md')).toBeNull();
    expect(validateForeignPattern('**/*.md')).toBeNull();
    expect(validateForeignPattern('docs/**/*.md')).toBeNull();
    expect(validateForeignPattern('**')).toBeNull();
  });

  it('returns empty-pattern when pattern is empty', () => {
    expect(validateForeignPattern('')).toBe('empty-pattern');
  });

  it('returns negation when pattern starts with exclamation mark', () => {
    expect(validateForeignPattern('!*.md')).toBe('negation');
    expect(validateForeignPattern('!docs')).toBe('negation');
  });

  it('returns brace-expansion when pattern contains curly braces', () => {
    expect(validateForeignPattern('*.{ts,js}')).toBe('brace-expansion');
    expect(validateForeignPattern('{a,b}')).toBe('brace-expansion');
    expect(validateForeignPattern('docs/test}')).toBe('brace-expansion');
    expect(validateForeignPattern('docs/{test')).toBe('brace-expansion');
  });

  it('returns regular-expression when pattern looks like a regex', () => {
    expect(validateForeignPattern('^.*\\.md$')).toBe('regular-expression');
    expect(validateForeignPattern('^foo')).toBe('regular-expression');
    expect(validateForeignPattern('.*\\.md$')).toBe('regular-expression');
    expect(validateForeignPattern('/^.*\\.md$/')).toBe('regular-expression');
    expect(validateForeignPattern('/.*\\.md/')).toBe('regular-expression');
  });

  it('returns absolute-pattern when pattern starts with slash but is not regex', () => {
    expect(validateForeignPattern('/')).toBe('absolute-pattern');
    expect(validateForeignPattern('/src/*.md')).toBe('absolute-pattern');
  });

  it('returns empty-segment when pattern contains consecutive slashes or trailing slash', () => {
    expect(validateForeignPattern('docs//*.md')).toBe('empty-segment');
    expect(validateForeignPattern('docs/*.md/')).toBe('empty-segment');
    expect(validateForeignPattern('a///b')).toBe('empty-segment');
  });

  it('returns dot-segment when pattern contains dot or double dot segment', () => {
    expect(validateForeignPattern('.')).toBe('dot-segment');
    expect(validateForeignPattern('..')).toBe('dot-segment');
    expect(validateForeignPattern('./*.md')).toBe('dot-segment');
    expect(validateForeignPattern('../*.md')).toBe('dot-segment');
    expect(validateForeignPattern('docs/./*.md')).toBe('dot-segment');
    expect(validateForeignPattern('docs/../*.md')).toBe('dot-segment');
  });

  it('returns invalid-globstar when globstar is within a segment with other characters', () => {
    expect(validateForeignPattern('a**/*.md')).toBe('invalid-globstar');
    expect(validateForeignPattern('**b/*.md')).toBe('invalid-globstar');
    expect(validateForeignPattern('a**b/*.md')).toBe('invalid-globstar');
    expect(validateForeignPattern('***/*.md')).toBe('invalid-globstar');
  });
});

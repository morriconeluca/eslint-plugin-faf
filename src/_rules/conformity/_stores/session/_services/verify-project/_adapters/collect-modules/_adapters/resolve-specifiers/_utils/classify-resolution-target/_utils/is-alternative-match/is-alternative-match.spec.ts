import { describe, expect, it } from 'vitest';

import { isAlternativeMatch } from './is-alternative-match.util.js';

describe('isAlternativeMatch', () => {
  it('returns true when normalized paths are exactly equal', () => {
    expect(isAlternativeMatch('src/unit', 'src/unit')).toBe(true);
    expect(isAlternativeMatch('./src/unit', './src/unit')).toBe(true);
    expect(isAlternativeMatch('src\\unit', 'src\\unit')).toBe(true);
  });

  it('handles paths with leading ./', () => {
    expect(isAlternativeMatch('./src/target.ts', 'src/target.ts')).toBe(true);
    expect(isAlternativeMatch('src/target.ts', './src/target.ts')).toBe(true);
  });

  it('returns true when resolved path is within directory alternative', () => {
    expect(isAlternativeMatch('src/unit/index.ts', 'src/unit')).toBe(true);
    expect(isAlternativeMatch('src/unit/sub/file.ts', 'src/unit')).toBe(true);
  });

  it('returns true when resolved path has an extension attached to alternative name', () => {
    expect(isAlternativeMatch('src/unit.ts', 'src/unit')).toBe(true);
    expect(isAlternativeMatch('src/unit.component.tsx', 'src/unit')).toBe(true);
  });

  it('returns false when path has a hyphenated suffix not separated by slash or dot', () => {
    expect(isAlternativeMatch('src/unit-test.ts', 'src/unit')).toBe(false);
  });

  it('returns true when alternative has .js extension and resolved has corresponding .ts or .tsx', () => {
    expect(isAlternativeMatch('src/unit.ts', 'src/unit.js')).toBe(true);
    expect(isAlternativeMatch('src/unit.tsx', 'src/unit.js')).toBe(true);
    expect(isAlternativeMatch('src/unit.mjs', 'src/unit.js')).toBe(true);
  });

  it('returns false when resolved file has no extension but alternative has one', () => {
    expect(isAlternativeMatch('src/unit', 'src/unit.js')).toBe(false);
  });

  it('returns false when alternative has extension but resolved file has a different base name', () => {
    expect(isAlternativeMatch('src/other.ts', 'src/unit.js')).toBe(false);
  });

  it('returns false when alternative has no extension and resolved is extension-only', () => {
    expect(isAlternativeMatch('.ts', 'src/unit')).toBe(false);
  });

  it('handles root dot alternative paths', () => {
    expect(isAlternativeMatch('src/file.ts', '.')).toBe(true);
    expect(isAlternativeMatch('../outside.ts', '.')).toBe(false);
  });

  it('handles dot-slash alternative paths', () => {
    expect(isAlternativeMatch('src/file.ts', './')).toBe(true);
    expect(isAlternativeMatch('../outside.ts', './')).toBe(false);
  });

  it('returns false for completely different directories', () => {
    expect(isAlternativeMatch('src/other/unit.ts', 'src/unit')).toBe(false);
  });
});

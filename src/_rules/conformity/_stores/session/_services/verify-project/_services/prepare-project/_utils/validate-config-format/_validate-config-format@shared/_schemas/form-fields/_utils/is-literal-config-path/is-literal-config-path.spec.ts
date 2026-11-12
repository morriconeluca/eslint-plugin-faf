import { describe, expect, it } from 'vitest';

import { isLiteralConfigPath } from './is-literal-config-path.util.js';

describe('isLiteralConfigPath', () => {
  describe('faf.feature: Verificare la forma dei percorsi letterali', () => {
    it('accepts dot alone identifying base directory', () => {
      expect(isLiteralConfigPath('.')).toBe(true);
    });

    it('accepts single segment path', () => {
      expect(isLiteralConfigPath('src')).toBe(true);
    });

    it('accepts path with square brackets as literal characters', () => {
      expect(isLiteralConfigPath('src/app/[todoId]')).toBe(true);
    });

    it('accepts path with round parentheses as literal characters', () => {
      expect(isLiteralConfigPath('src/app/(auth)')).toBe(true);
    });

    it('accepts path with hyphenated brackets and underscores', () => {
      expect(isLiteralConfigPath('src/_apis/_[todo-id]')).toBe(true);
    });

    it('accepts path with at sign as literal character', () => {
      expect(isLiteralConfigPath('src/_src@shared')).toBe(true);
    });

    it('rejects leading slash', () => {
      expect(isLiteralConfigPath('/src')).toBe(false);
    });

    it('rejects leading dot segment', () => {
      expect(isLiteralConfigPath('./src')).toBe(false);
    });

    it('rejects trailing slash', () => {
      expect(isLiteralConfigPath('src/')).toBe(false);
    });

    it('rejects consecutive slashes creating empty segment', () => {
      expect(isLiteralConfigPath('src//app')).toBe(false);
    });

    it('rejects intermediate dot segment', () => {
      expect(isLiteralConfigPath('src/./app')).toBe(false);
    });

    it('rejects intermediate parent directory segment', () => {
      expect(isLiteralConfigPath('src/../app')).toBe(false);
    });

    it('rejects leading parent directory segment', () => {
      expect(isLiteralConfigPath('../src')).toBe(false);
    });
  });

  describe('boundary and defensive conditions', () => {
    it('rejects empty string', () => {
      expect(isLiteralConfigPath('')).toBe(false);
    });

    it('rejects dot-dot alone', () => {
      expect(isLiteralConfigPath('..')).toBe(false);
    });

    it('rejects single slash', () => {
      expect(isLiteralConfigPath('/')).toBe(false);
    });

    it('rejects double slash', () => {
      expect(isLiteralConfigPath('//')).toBe(false);
    });

    it('rejects dot followed by slash', () => {
      expect(isLiteralConfigPath('./')).toBe(false);
    });

    it('rejects slash followed by dot', () => {
      expect(isLiteralConfigPath('/.')).toBe(false);
    });

    it('rejects nested empty segments with dots', () => {
      expect(isLiteralConfigPath('.//.')).toBe(false);
    });

    it('rejects deeply nested dot segments', () => {
      expect(isLiteralConfigPath('src/a/./b')).toBe(false);
    });

    it('rejects deeply nested dot-dot segments', () => {
      expect(isLiteralConfigPath('src/a/../b')).toBe(false);
    });

    it('accepts multi-level ordinary paths', () => {
      expect(isLiteralConfigPath('a/b/c')).toBe(true);
    });

    it('rejects path containing backslash', () => {
      expect(isLiteralConfigPath('src\\app')).toBe(false);
      expect(isLiteralConfigPath('\\src')).toBe(false);
      expect(isLiteralConfigPath('src\\')).toBe(false);
    });
  });
});

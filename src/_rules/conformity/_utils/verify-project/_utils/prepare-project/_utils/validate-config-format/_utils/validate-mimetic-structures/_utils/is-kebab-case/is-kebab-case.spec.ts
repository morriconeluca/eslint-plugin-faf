import { describe, expect, it } from 'vitest';

import { isKebabCase } from './is-kebab-case.util.js';

describe('isKebabCase', () => {
  describe('nominal kebab-case grammar', () => {
    it.each([
      { candidate: 'user-profile', expected: true },
      { candidate: 'UserProfile', expected: false },
      { candidate: 'user_profile', expected: false },
      { candidate: 'get-', expected: false },
      { candidate: 'Get-Todo', expected: false },
      { candidate: 'todo-id', expected: true },
      { candidate: 'todoId', expected: false },
      { candidate: 'v1', expected: true },
      { candidate: '2fa', expected: true },
      { candidate: '', expected: false },
      { candidate: 'a--b', expected: false },
      { candidate: '-a', expected: false },
      { candidate: 'à', expected: false },
    ])(
      'evaluates candidate "$candidate" expecting $expected',
      ({ candidate, expected }) => {
        expect(isKebabCase(candidate)).toBe(expected);
      }
    );
  });

  describe('additional boundary cases', () => {
    it.each([
      { candidate: 'a', expected: true },
      { candidate: '0', expected: true },
      { candidate: '9', expected: true },
      { candidate: '123', expected: true },
      { candidate: 'a-b-c-d', expected: true },
      { candidate: 'a-1-b-2', expected: true },
      { candidate: '-', expected: false },
      { candidate: '--', expected: false },
      { candidate: 'a-', expected: false },
      { candidate: 'a-b-', expected: false },
      { candidate: '-a-b', expected: false },
      { candidate: 'a b', expected: false },
      { candidate: 'user-Profile', expected: false },
      { candidate: 'user-profile!', expected: false },
      { candidate: 'É', expected: false },
      { candidate: 'ö', expected: false },
    ])(
      'evaluates boundary candidate "$candidate" expecting $expected',
      ({ candidate, expected }) => {
        expect(isKebabCase(candidate)).toBe(expected);
      }
    );
  });
});

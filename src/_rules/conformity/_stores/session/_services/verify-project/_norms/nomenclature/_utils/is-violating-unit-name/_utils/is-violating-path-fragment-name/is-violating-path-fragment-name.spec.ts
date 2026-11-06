import { describe, expect, it } from 'vitest';

import type { TEffectiveMimeticStructure } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { isViolatingPathFragmentName } from './index.js';

describe('isViolatingPathFragmentName', () => {
  it('verifies target-only naming when no action catalog is declared', () => {
    const structures: readonly TEffectiveMimeticStructure[] = [
      { actions: null, paths: ['src/_pages'] },
      { actions: [], paths: ['src/_views'] },
    ];

    expect(
      isViolatingPathFragmentName('home', 'src/_pages/home', structures)
    ).toBe(false);
    expect(
      isViolatingPathFragmentName(
        'blog-feed',
        'src/_pages/blog-feed',
        structures
      )
    ).toBe(false);
    expect(
      isViolatingPathFragmentName('BlogPost', 'src/_pages/BlogPost', structures)
    ).toBe(true);
    expect(
      isViolatingPathFragmentName('overview', 'src/_views/overview', structures)
    ).toBe(false);
    expect(
      isViolatingPathFragmentName('Overview', 'src/_views/Overview', structures)
    ).toBe(true);
  });

  it('verifies fallback when no mimetic structure matches', () => {
    expect(isViolatingPathFragmentName('standalone', 'src/other', [])).toBe(
      false
    );
    expect(isViolatingPathFragmentName('Invalid', 'src/other', [])).toBe(true);
  });

  it('selects the longest matching action prefix regardless of catalog order', () => {
    const orders: readonly (readonly string[])[] = [
      ['get', 'get-or-create'],
      ['get-or-create', 'get'],
    ];

    for (const actions of orders) {
      const structures: readonly TEffectiveMimeticStructure[] = [
        { actions, paths: ['src/_apis'] },
      ];

      expect(
        isViolatingPathFragmentName(
          'get-or-create-todo',
          'src/_apis/get-or-create-todo',
          structures
        )
      ).toBe(false);
      expect(
        isViolatingPathFragmentName(
          'get-todo',
          'src/_apis/get-todo',
          structures
        )
      ).toBe(false);
      expect(
        isViolatingPathFragmentName(
          'get-or-create-',
          'src/_apis/get-or-create-',
          structures
        )
      ).toBe(true);
      expect(
        isViolatingPathFragmentName(
          'getter-todo',
          'src/_apis/getter-todo',
          structures
        )
      ).toBe(true);
      expect(
        isViolatingPathFragmentName(
          'delete-todo',
          'src/_apis/delete-todo',
          structures
        )
      ).toBe(true);
    }
  });

  it('rejects targets that are empty or violate kebab-case', () => {
    const structures: readonly TEffectiveMimeticStructure[] = [
      { actions: ['patch'], paths: ['src/_apis'] },
    ];

    expect(
      isViolatingPathFragmentName(
        'patch-todo-status',
        'src/_apis/patch-todo-status',
        structures
      )
    ).toBe(false);
    expect(
      isViolatingPathFragmentName(
        'patch-TodoStatus',
        'src/_apis/patch-TodoStatus',
        structures
      )
    ).toBe(true);
    expect(
      isViolatingPathFragmentName('patch-', 'src/_apis/patch-', structures)
    ).toBe(true);
  });
});

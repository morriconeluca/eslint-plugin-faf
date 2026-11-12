import { describe, expect, it } from 'vitest';

import type { TEffectiveMimeticStructure } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { isViolatingPathFragmentName } from './is-violating-path-fragment-name.util.js';

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
      isViolatingPathFragmentName(
        'home_invalid',
        'src/_pages/home_invalid',
        structures
      )
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
    expect(
      isViolatingPathFragmentName('standalone_invalid', 'src/other', [])
    ).toBe(true);
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
          'get-or-create',
          'src/_apis/get-or-create',
          structures
        )
      ).toBe(true);
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
      isViolatingPathFragmentName(
        'patch-todo_extra',
        'src/_apis/patch-todo_extra',
        structures
      )
    ).toBe(true);
    expect(
      isViolatingPathFragmentName('patch-', 'src/_apis/patch-', structures)
    ).toBe(true);
    expect(
      isViolatingPathFragmentName('patch', 'src/_apis/patch', structures)
    ).toBe(true);
  });

  it('isolates target boundaries from action prefix length', () => {
    const structures: readonly TEffectiveMimeticStructure[] = [
      { actions: ['geT'], paths: ['src/_apis'] },
    ];

    expect(
      isViolatingPathFragmentName('geT-todo', 'src/_apis/geT-todo', structures)
    ).toBe(false);
  });

  it('rejects an exact composite action without target to prevent prefix truncation', () => {
    const structures: readonly TEffectiveMimeticStructure[] = [
      { actions: ['post', 'post-feed'], paths: ['src/_apis'] },
    ];

    expect(
      isViolatingPathFragmentName(
        'post-feed',
        'src/_apis/post-feed',
        structures
      )
    ).toBe(true);
    expect(
      isViolatingPathFragmentName(
        'post-feed-item',
        'src/_apis/post-feed-item',
        structures
      )
    ).toBe(false);
  });

  it('selects the nearest matching structure with the longest prefix in either catalog order', () => {
    const outerStructure: TEffectiveMimeticStructure = {
      actions: null,
      paths: ['src/_pages'],
    };
    const innerStructure: TEffectiveMimeticStructure = {
      actions: ['get', 'post'],
      paths: ['src/_pages/home/_apis'],
    };

    const configurations = [
      [outerStructure, innerStructure],
      [innerStructure, outerStructure],
    ];

    for (const structures of configurations) {
      expect(
        isViolatingPathFragmentName(
          'get-todo',
          'src/_pages/home/_apis/get-todo',
          structures
        )
      ).toBe(false);
      expect(
        isViolatingPathFragmentName(
          'delete-todo',
          'src/_pages/home/_apis/delete-todo',
          structures
        )
      ).toBe(true);
      expect(
        isViolatingPathFragmentName('home', 'src/_pages/home', structures)
      ).toBe(false);
    }
  });

  it('verifies exact prefix match and boundary checking on folder names', () => {
    const structures: readonly TEffectiveMimeticStructure[] = [
      { actions: ['get'], paths: ['src/_apis'] },
    ];

    expect(
      isViolatingPathFragmentName('get-todo', 'src/_apis', structures)
    ).toBe(false);
    expect(
      isViolatingPathFragmentName('delete-todo', 'src/_apis', structures)
    ).toBe(true);
    expect(
      isViolatingPathFragmentName(
        'other-todo',
        'src/_apis_extra/other-todo',
        structures
      )
    ).toBe(false);
    expect(
      isViolatingPathFragmentName(
        'OtherTodo',
        'src/_apis_extra/OtherTodo',
        structures
      )
    ).toBe(true);
  });
});

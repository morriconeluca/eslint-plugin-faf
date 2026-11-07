import { describe, expect, it } from 'vitest';

import type { THorizontalHierarchies } from '../../../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

import { isOrderedDownward } from './is-ordered-downward.util.js';

describe('isOrderedDownward', () => {
  it('returns false when hierarchies are empty', () => {
    const hierarchies: THorizontalHierarchies = { conflicts: [], sets: [] };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when source item is in conflicts', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [{ hierarchyIds: [1, 2], itemId: 1 }],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when destination item is in conflicts', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [{ hierarchyIds: [1, 2], itemId: 2 }],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns true when an unrelated item is in conflicts', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [{ hierarchyIds: [1, 2], itemId: 99 }],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(true);
  });

  it('returns false when hierarchy set is not orderable', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: false,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when parentPath does not match', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src/other',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when source item appears multiple times in siblings', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: ['a'],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 1, rank: 0 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when destination item appears multiple times in siblings', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: ['b'],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns true when source rank is strictly greater than destination rank', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(true);
  });

  it('returns false when source rank is less than or equal to destination rank', () => {
    const hierarchies: THorizontalHierarchies = {
      conflicts: [],
      sets: [
        {
          id: 1,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 2, rank: 2 },
          ],
        },
      ],
    };
    expect(isOrderedDownward(1, 2, 'src', hierarchies)).toBe(false);
  });
});

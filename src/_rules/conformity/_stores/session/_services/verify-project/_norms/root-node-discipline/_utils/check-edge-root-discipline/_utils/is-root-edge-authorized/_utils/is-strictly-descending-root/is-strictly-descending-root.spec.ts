import { describe, expect, it } from 'vitest';

import type {
  THorizontalHierarchies,
  THorizontalHierarchyConflict,
  THorizontalHierarchySet,
} from '../../../../../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

import { isStrictlyDescendingRoot } from './is-strictly-descending-root.util.js';

const makeHierarchies = (
  options: {
    readonly conflicts?: readonly THorizontalHierarchyConflict[];
    readonly sets?: readonly THorizontalHierarchySet[];
  } = {}
): THorizontalHierarchies => ({
  conflicts: options.conflicts ?? [],
  sets: options.sets ?? [],
});

describe('isStrictlyDescendingRoot', () => {
  it('returns false when no hierarchy set matches parentPath and origin', () => {
    const hierarchies = makeHierarchies({ sets: [] });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when hierarchy set has different origin', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when hierarchy set has different parentPath', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'other',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('finds matching set among multiple non-matching sets', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'general',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 0 },
            { itemId: 2, rank: 1 },
          ],
        },
        {
          id: 1,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(true);
  });

  const noRepetitions: readonly string[] = [];

  it.each([
    {
      description: 'set is not orderable',
      isOrderable: false,
      repetitions: noRepetitions,
    },
    {
      description: 'set has repetitions',
      isOrderable: true,
      repetitions: ['main.ts'],
    },
  ])('returns false when $description', ({ isOrderable, repetitions }) => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions,
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it.each([
    { conflictingItemId: 1, description: 'source item has conflict' },
    { conflictingItemId: 2, description: 'destination item has conflict' },
  ])('returns false when $description', ({ conflictingItemId }) => {
    const hierarchies = makeHierarchies({
      conflicts: [{ hierarchyIds: [0, 1], itemId: conflictingItemId }],
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when source has multiple sibling ranks', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 1 },
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when destination has no sibling rank', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [{ itemId: 1, rank: 1 }],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it('returns false when destination has multiple sibling ranks', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 0 },
            { itemId: 2, rank: 1 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
  });

  it.each([
    { description: 'equal rank', destinationRank: 0, sourceRank: 0 },
    { description: 'lower rank', destinationRank: 1, sourceRank: 0 },
  ])(
    'returns false when source rank is $description to destination rank',
    ({ destinationRank, sourceRank }) => {
      const hierarchies = makeHierarchies({
        sets: [
          {
            id: 0,
            isOrderable: true,
            origin: 'root-nodes',
            parentPath: 'src',
            repetitions: [],
            siblings: [
              { itemId: 1, rank: sourceRank },
              { itemId: 2, rank: destinationRank },
            ],
          },
        ],
      });

      expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(false);
    }
  );

  it('returns true when source rank is strictly greater than destination rank', () => {
    const hierarchies = makeHierarchies({
      sets: [
        {
          id: 0,
          isOrderable: true,
          origin: 'root-nodes',
          parentPath: 'src',
          repetitions: [],
          siblings: [
            { itemId: 1, rank: 2 },
            { itemId: 2, rank: 0 },
          ],
        },
      ],
    });

    expect(isStrictlyDescendingRoot(1, 2, 'src', hierarchies)).toBe(true);
  });
});

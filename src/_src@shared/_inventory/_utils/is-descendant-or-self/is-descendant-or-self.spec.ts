import { describe, expect, it } from 'vitest';

import type { TInventoryItem } from '../../_types/inventory.type.js';

import { isDescendantOrSelf } from './index.js';

const createMockItem = (
  preorderStart: number,
  preorderEnd: number
): TInventoryItem => ({
  depth: 0,
  id: preorderStart,
  isSymlink: false,
  kind: 'directory',
  parentId: null,
  path: 'test',
  preorderEnd,
  preorderStart,
  realPath: 'test',
  treeOrigin: 'test',
});

describe('isDescendantOrSelf', () => {
  it('returns true when candidate and ancestor are the identical item', () => {
    const item = createMockItem(2, 5);
    expect(isDescendantOrSelf(item, item)).toBe(true);
  });

  it('returns true when candidate is strictly nested inside ancestor interval', () => {
    const ancestor = createMockItem(1, 10);
    const candidate = createMockItem(3, 7);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(true);
  });

  it('returns true when candidate starts at the same preorderStart as ancestor', () => {
    const ancestor = createMockItem(3, 8);
    const candidate = createMockItem(3, 5);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(true);
  });

  it('returns true when candidate ends at the same preorderEnd as ancestor', () => {
    const ancestor = createMockItem(2, 8);
    const candidate = createMockItem(5, 8);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(true);
  });

  it('returns false when candidate begins before ancestor preorderStart', () => {
    const ancestor = createMockItem(4, 9);
    const candidate = createMockItem(3, 8);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(false);
  });

  it('returns false when candidate ends after ancestor preorderEnd', () => {
    const ancestor = createMockItem(2, 6);
    const candidate = createMockItem(4, 7);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(false);
  });

  it('returns false when intervals are completely disjoint and candidate is after ancestor', () => {
    const ancestor = createMockItem(1, 3);
    const candidate = createMockItem(4, 6);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(false);
  });

  it('returns false when intervals are completely disjoint and candidate is before ancestor', () => {
    const ancestor = createMockItem(5, 8);
    const candidate = createMockItem(1, 4);
    expect(isDescendantOrSelf(candidate, ancestor)).toBe(false);
  });
});

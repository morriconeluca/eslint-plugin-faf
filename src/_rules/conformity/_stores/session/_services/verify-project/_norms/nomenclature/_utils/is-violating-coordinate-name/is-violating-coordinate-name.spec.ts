import { describe, expect, it } from 'vitest';

import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isViolatingCoordinateName } from './is-violating-coordinate-name.util.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createClassification = (
  path: string,
  domainKind: null | TItemClassification['domainKind']
): TItemClassification => ({
  domainKind,
  entryKind: 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 0,
  nodeKind: null,
  path,
  relationalQualifications: qualifications,
  role: { kind: 'absent', roleName: null },
});

describe('isViolatingCoordinateName', () => {
  it('returns false when the classification is not a path-sub-category', () => {
    expect(
      isViolatingCoordinateName(
        createClassification('src/_components', 'category')
      )
    ).toBe(false);
    expect(
      isViolatingCoordinateName(createClassification('src/unknown', null))
    ).toBe(false);
  });

  it('accepts valid dynamic coordinate segments', () => {
    expect(
      isViolatingCoordinateName(
        createClassification('src/_apis/_[todo-id]', 'path-sub-category')
      )
    ).toBe(false);
  });

  it('rejects malformed dynamic coordinate segments', () => {
    for (const segment of ['_[todoId]', '_[]', '_[todo-id']) {
      expect(
        isViolatingCoordinateName(
          createClassification(`src/_apis/${segment}`, 'path-sub-category')
        )
      ).toBe(true);
    }
  });

  it('accepts valid static coordinate segments', () => {
    for (const segment of ['_todos', '_status', '_v1']) {
      expect(
        isViolatingCoordinateName(
          createClassification(`src/_apis/${segment}`, 'path-sub-category')
        )
      ).toBe(false);
    }
  });

  it('rejects invalid static coordinate segments or missing underscores', () => {
    for (const segment of ['_todo[id]', 'todos', '[todo-id]']) {
      expect(
        isViolatingCoordinateName(
          createClassification(`src/_apis/${segment}`, 'path-sub-category')
        )
      ).toBe(true);
    }
  });
});

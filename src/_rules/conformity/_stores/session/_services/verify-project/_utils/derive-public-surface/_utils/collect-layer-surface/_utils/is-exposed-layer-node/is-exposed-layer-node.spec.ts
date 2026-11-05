import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isExposedLayerNode } from './index.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const item = (
  path: string,
  entryKind: 'directory' | 'file',
  domainKind: TItemClassification['domainKind'],
  nodeKind: TItemClassification['nodeKind']
): TItemClassification => ({
  domainKind,
  entryKind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind,
  path,
  relationalQualifications: qualifications,
  role: absentRole,
});

const taxonomyOf = (
  classifications: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(
    classifications.map((entry, index) => [index, { ...entry, itemId: index }])
  ),
  byPath: new Map(classifications.map((entry) => [entry.path, entry])),
  classifications,
});

const isExposed = (path: string, taxonomy: TTaxonomyModel): boolean =>
  isExposedLayerNode(path, 'src', taxonomy);

describe('isExposedLayerNode', () => {
  it('exposes a Category Node when the Root Layer is the configuration directory', () => {
    const taxonomy = taxonomyOf([
      item('.', 'directory', 'root-layer', null),
      item('_types', 'directory', 'category', null),
      item('_types/size.type.ts', 'file', null, 'category-node'),
    ]);
    expect(isExposedLayerNode('_types/size.type.ts', '.', taxonomy)).toBe(true);
  });

  it('rejects a path outside the Root Layer origin', () => {
    const taxonomy = taxonomyOf([
      item('lib/open.ts', 'file', null, 'category-node'),
    ]);
    expect(isExposed('lib/open.ts', taxonomy)).toBe(false);
  });

  it('rejects a path whose ancestor is unclassified', () => {
    const taxonomy = taxonomyOf([
      item('src/_types/size.type.ts', 'file', null, 'category-node'),
    ]);
    expect(isExposed('src/_types/size.type.ts', taxonomy)).toBe(false);
  });

  it('does not expose a classified directory or an unclassified file', () => {
    const taxonomy = taxonomyOf([
      item('src', 'directory', 'root-layer', null),
      item('src/_types', 'directory', 'category', null),
    ]);
    expect(isExposed('src/_types', taxonomy)).toBe(false);
    expect(isExposed('src/_types/missing.type.ts', taxonomy)).toBe(false);
  });

  it('exposes a Category Node of a direct Category and not a Foreign Node', () => {
    const taxonomy = taxonomyOf([
      item('src', 'directory', 'root-layer', null),
      item('src/_types', 'directory', 'category', null),
      item('src/_types/size.type.ts', 'file', null, 'category-node'),
      item('src/_types/notes.md', 'file', null, 'foreign-node'),
    ]);
    expect(isExposed('src/_types/size.type.ts', taxonomy)).toBe(true);
    expect(isExposed('src/_types/notes.md', taxonomy)).toBe(false);
  });

  it('exposes an Access Node reached through a Layer and not its Fragment Node', () => {
    const taxonomy = taxonomyOf([
      item('src', 'directory', 'root-layer', null),
      item('src/_ui', 'directory', 'layer', null),
      item('src/_ui/_components', 'directory', 'category', null),
      item('src/_ui/_components/button', 'directory', 'fragment', null),
      item('src/_ui/_components/button/index.ts', 'file', null, 'access-node'),
      item(
        'src/_ui/_components/button/button.component.tsx',
        'file',
        null,
        'fragment-node'
      ),
    ]);
    expect(isExposed('src/_ui/_components/button/index.ts', taxonomy)).toBe(
      true
    );
    expect(
      isExposed('src/_ui/_components/button/button.component.tsx', taxonomy)
    ).toBe(false);
  });

  it('exposes units in Sub-Categories and Path Sub-Categories', () => {
    const taxonomy = taxonomyOf([
      item('src', 'directory', 'root-layer', null),
      item('src/_types', 'directory', 'category', null),
      item('src/_types/_ids', 'directory', 'sub-category', null),
      item('src/_types/_ids/user-id.type.ts', 'file', null, 'category-node'),
      item('src/_routes', 'directory', 'category', null),
      item('src/_routes/_users', 'directory', 'path-sub-category', null),
      item('src/_routes/_users/get-user', 'directory', 'fragment', null),
      item('src/_routes/_users/get-user/index.ts', 'file', null, 'access-node'),
    ]);
    expect(isExposed('src/_types/_ids/user-id.type.ts', taxonomy)).toBe(true);
    expect(isExposed('src/_routes/_users/get-user/index.ts', taxonomy)).toBe(
      true
    );
  });

  it('does not enter a Fractal Branch, a Private Category, or a nested Fragment', () => {
    const taxonomy = taxonomyOf([
      item('src', 'directory', 'root-layer', null),
      item('src/_src@shared', 'directory', 'fractal-branch', null),
      item('src/_src@shared/_types', 'directory', 'category', null),
      item(
        'src/_src@shared/_types/shared.type.ts',
        'file',
        null,
        'category-node'
      ),
      item('src/_components', 'directory', 'category', null),
      item('src/_components/button', 'directory', 'fragment', null),
      item('src/_components/button/_utils', 'directory', 'category', null),
      item(
        'src/_components/button/_utils/format',
        'directory',
        'fragment',
        null
      ),
      item(
        'src/_components/button/_utils/format/index.ts',
        'file',
        null,
        'access-node'
      ),
      item('src/_components/button/panel', 'directory', 'fragment', null),
      item(
        'src/_components/button/panel/index.ts',
        'file',
        null,
        'access-node'
      ),
    ]);
    expect(isExposed('src/_src@shared/_types/shared.type.ts', taxonomy)).toBe(
      false
    );
    expect(
      isExposed('src/_components/button/_utils/format/index.ts', taxonomy)
    ).toBe(false);
    expect(isExposed('src/_components/button/panel/index.ts', taxonomy)).toBe(
      false
    );
  });
});

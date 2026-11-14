import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { selectAnchorPath } from './select-anchor-path.util.js';

const baseDirectory = '/repo';
const configPath = '/repo/faf.config.ts';

const inventoryItem = (
  id: number,
  path: string,
  kind: TInventoryItem['kind'],
  parentId: null | number
): TInventoryItem => ({
  depth: parentId === null ? 0 : 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const classification = (
  item: TInventoryItem,
  domainKind: TItemClassification['domainKind'],
  nodeKind: TItemClassification['nodeKind']
): TItemClassification => ({
  domainKind,
  entryKind: item.kind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: item.id,
  nodeKind,
  path: item.path,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

const modelFrom = (
  classified: readonly TItemClassification[]
): TSelectModel => {
  const byItemId = new Map(classified.map((entry) => [entry.itemId, entry]));
  const byPath = new Map(classified.map((entry) => [entry.path, entry]));
  return { byItemId, byPath, classifications: classified };
};

type TSelectModel = NonNullable<
  Parameters<typeof selectAnchorPath>[0]['model']
>;

const inventoryFrom = (items: readonly TInventoryItem[]): TInventory => ({
  items,
  pathToId: new Map(items.map((item) => [item.path, item.id])),
  realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
});

const configOutcome = (element: string): TOutcome => ({
  constraint: 'configuration/unknown-property',
  element,
  family: 'configuration',
  message: 'Unknown property.',
  normativeReference: 'FAF §1.2, §6.9',
  propertyPath: 'extra',
});

const classificationOutcome = (element: string): TOutcome => ({
  constraint: 'classification/unclassifiable-directory',
  element,
  family: 'classification',
  message: `Directory '${element}' has no unique Logical Domain classification.`,
  normativeReference: 'FAF §6.9',
});

describe('selectAnchorPath', () => {
  const src = inventoryItem(0, 'src', 'directory', null);
  const fragment = inventoryItem(1, 'src/widget', 'directory', 0);
  const master = inventoryItem(2, 'src/widget/widget.util.ts', 'file', 1);
  const access = inventoryItem(3, 'src/widget/index.ts', 'file', 1);
  const asset = inventoryItem(4, 'src/widget/logo.png', 'file', 1);
  const mystery = inventoryItem(5, 'src/mystery', 'directory', 0);
  const later = inventoryItem(6, 'src/mystery/b.ts', 'file', 5);
  const earlier = inventoryItem(7, 'src/mystery/a.ts', 'file', 5);
  const items = [src, fragment, master, access, asset, mystery, later, earlier];
  const inventory = inventoryFrom(items);
  const model = modelFrom([
    classification(src, 'root-layer', null),
    classification(fragment, 'fragment', null),
    classification(master, null, 'master-node'),
    classification(access, null, 'access-node'),
    classification(asset, null, 'foreign-node'),
    classification(mystery, null, null),
    classification(later, null, null),
    classification(earlier, null, null),
  ]);

  it('anchors configuration outcomes to faf.config.ts', () => {
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        inventory,
        model,
        outcome: configOutcome('src/widget/widget.util.ts'),
      })
    ).toBe(configPath);
  });

  it('anchors a lintable file to that absolute file', () => {
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        inventory,
        model,
        outcome: classificationOutcome('src/widget/widget.util.ts'),
      })
    ).toBe(nodePath.resolve(baseDirectory, 'src/widget/widget.util.ts'));
  });

  it('anchors a fragment to its master when the master exists', () => {
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        inventory,
        model,
        outcome: classificationOutcome('src/widget'),
      })
    ).toBe(nodePath.resolve(baseDirectory, 'src/widget/widget.util.ts'));
  });

  it('anchors a domain to the first lintable direct child in ordinal order', () => {
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        inventory,
        model,
        outcome: classificationOutcome('src/mystery'),
      })
    ).toBe(nodePath.resolve(baseDirectory, 'src/mystery/a.ts'));
  });

  it('anchors a non-lintable file through its parent domain', () => {
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        inventory,
        model,
        outcome: classificationOutcome('src/widget/logo.png'),
      })
    ).toBe(nodePath.resolve(baseDirectory, 'src/widget/widget.util.ts'));
  });

  it('ascends to the nearest ancestor that contains a lintable file', () => {
    const empty = inventoryItem(8, 'src/mystery/empty', 'directory', 5);
    const ascended = inventoryFrom([...items, empty]);
    const ascendedModel = modelFrom([
      ...model.classifications,
      classification(empty, null, null),
    ]);
    const anchor = selectAnchorPath({
      baseDirectory,
      configPath,
      inventory: ascended,
      model: ascendedModel,
      outcome: classificationOutcome('src/mystery/empty'),
    });
    expect(anchor).toBe(nodePath.resolve(baseDirectory, 'src/mystery/a.ts'));
  });

  it('anchors a foreign root-layer file to its lintable sibling', () => {
    const parent = inventoryItem(0, 'src', 'directory', null);
    const asset = inventoryItem(1, 'src/logo.png', 'file', 0);
    const file = inventoryItem(2, 'src/a.ts', 'file', 0);
    const anchor = selectAnchorPath({
      baseDirectory,
      configPath,
      inventory: inventoryFrom([parent, asset, file]),
      model: modelFrom([
        classification(parent, 'root-layer', null),
        classification(asset, null, 'foreign-node'),
        classification(file, null, 'fragment-node'),
      ]),
      outcome: classificationOutcome('src/logo.png'),
    });
    expect(anchor).toBe(nodePath.resolve(baseDirectory, 'src/a.ts'));
  });

  it('falls back to faf.config.ts for a non-lintable file with no parent', () => {
    const asset = inventoryItem(0, 'logo.png', 'file', null);
    const anchor = selectAnchorPath({
      baseDirectory,
      configPath,
      inventory: inventoryFrom([asset]),
      model: modelFrom([classification(asset, null, 'foreign-node')]),
      outcome: classificationOutcome('logo.png'),
    });
    expect(anchor).toBe(configPath);
  });

  it('falls back to faf.config.ts when the domain has no lintable descendant', () => {
    const empty = inventoryItem(0, 'src/empty', 'directory', null);
    const anchor = selectAnchorPath({
      baseDirectory,
      configPath,
      inventory: inventoryFrom([empty]),
      model: modelFrom([classification(empty, null, null)]),
      outcome: classificationOutcome('src/empty'),
    });
    expect(anchor).toBe(configPath);
  });

  it('falls back to faf.config.ts when no lintable file exists', () => {
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        outcome: classificationOutcome('src/missing'),
      })
    ).toBe(configPath);
    expect(
      selectAnchorPath({
        baseDirectory,
        configPath,
        inventory,
        model,
        outcome: classificationOutcome('src/absent'),
      })
    ).toBe(configPath);
  });

  it('resolves an absolute element path against the inventory', () => {
    const absoluteElement = nodePath.resolve(baseDirectory, 'src/mystery/b.ts');
    const anchor = selectAnchorPath({
      baseDirectory,
      configPath,
      inventory,
      model,
      outcome: classificationOutcome(absoluteElement),
    });
    expect(anchor).toBe(absoluteElement);
  });
});

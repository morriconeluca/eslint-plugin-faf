import { describe, expect, it } from 'vitest';

import type {
  TModuleRecord,
  TRootSymbol,
} from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { isViolatingSymbolUniqueness } from './is-violating-symbol-uniqueness.util.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createRole = (
  name: string,
  hasMultipleSymbolsAllowed = false
): TEffectiveRole => ({
  allowMultipleSymbols: hasMultipleSymbolsAllowed,
  category: `_${name}s`,
  form: 'category-nodes',
  implicitExtensions: [],
  name,
  rank: 1,
});

const createTree = (
  roles: readonly TEffectiveRole[] = [createRole('type'), createRole('util')]
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(roles.map((r) => [r.category, r])),
    extensionToRole: new Map(),
    roles,
    subGraphRoles: ['spec', 'story'],
    topRank: 10,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-layer',
  originPath: 'src',
  publicRootNodes: ['src/main.ts'],
  rootFragments: [],
  treeDependencyPairs: [],
});

const createClassification = (
  overrides?: Partial<TItemClassification>
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind: 'category-node',
  path: 'src/_types/sample.type.ts',
  relationalQualifications: qualifications,
  role: { kind: 'explicit', roleName: 'type' },
  ...overrides,
});

const createRecord = (symbolNames: readonly string[]): TModuleRecord => {
  const symbols: readonly TRootSymbol[] = symbolNames.map((name) => ({
    name,
    position: { column: 1, line: 1 },
    space: 'value',
  }));

  return {
    exports: [],
    imports: [],
    language: 'script',
    symbols,
    unsupportedSyntaxes: [],
  };
};

describe('isViolatingSymbolUniqueness', () => {
  const defaultTree = createTree();

  it('returns false when role roleName is null', () => {
    const classification = createClassification({
      role: { kind: 'explicit', roleName: null },
    });
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it('returns false when role kind is not explicit', () => {
    const classification = createClassification({
      role: { kind: 'implicit', roleName: 'type' },
    });
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it('returns false when nodeKind is null', () => {
    const classification = createClassification({ nodeKind: null });
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it.each([
    'master-node',
    'root-node',
    'access-node',
    'foreign-node',
    'sub-graph-node',
  ] as const)('returns false when nodeKind is %s', (nodeKind) => {
    const classification = createClassification({ nodeKind });
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it('returns false when role is a designated sub-graph role', () => {
    const classification = createClassification({
      nodeKind: 'category-node',
      role: { kind: 'explicit', roleName: 'spec' },
    });
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it('returns false when record defines 0 symbols', () => {
    const classification = createClassification();
    const record = createRecord([]);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it('returns false when record defines exactly 1 symbol', () => {
    const classification = createClassification();
    const record = createRecord(['single']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(false);
  });

  it('returns true when record defines 2 symbols and role does not allow multiple symbols', () => {
    const classification = createClassification();
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(true);
  });

  it('returns false when record defines 2 symbols and role allows multiple symbols', () => {
    const exemptTree = createTree([createRole('type', true)]);
    const classification = createClassification();
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, exemptTree)
    ).toBe(false);
  });

  it('returns true when role is not found in tree catalog', () => {
    const emptyCatalogTree = createTree([]);
    const classification = createClassification();
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, emptyCatalogTree)
    ).toBe(true);
  });

  it.each([
    'category-node',
    'fragment-node',
    'unauthorized-logical-node',
  ] as const)('evaluates symbol uniqueness for nodeKind %s', (nodeKind) => {
    const classification = createClassification({ nodeKind });
    const record = createRecord(['first', 'second']);
    expect(
      isViolatingSymbolUniqueness(classification, record, defaultTree)
    ).toBe(true);
  });
});

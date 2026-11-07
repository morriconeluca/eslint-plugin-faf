import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleRecord,
  TRootSymbol,
} from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isViolatingMasterSymbol } from './is-violating-master-symbol.util.js';

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createClassification = (
  overrides?: Partial<TItemClassification>
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: 'component',
  itemId: 1,
  nodeKind: 'master-node',
  path: 'src/widget/widget.component.ts',
  relationalQualifications: qualifications,
  role: { kind: 'explicit', roleName: 'component' },
  ...overrides,
});

const createRecord = (
  symbols: readonly string[],
  exports: readonly (readonly [string, string, string])[]
): TModuleRecord => {
  const rootSymbols: readonly TRootSymbol[] = symbols.map((name) => ({
    name,
    position: { column: 1, line: 1 },
    space: 'value',
  }));

  const moduleExports: readonly TModuleExport[] = exports.map(
    ([exportedName, originType, symbolName]) => {
      if (originType === 'local-symbol') {
        return {
          exportedName,
          isTypeOnly: false,
          origin: { symbolName, type: 'local-symbol' },
          position: { column: 1, line: 1 },
        };
      }
      return {
        exportedName,
        isTypeOnly: false,
        origin: {
          importedName: symbolName,
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 1, line: 1 },
      };
    }
  );

  return {
    exports: moduleExports,
    imports: [],
    language: 'script',
    symbols: rootSymbols,
    unsupportedSyntaxes: [],
  };
};

describe('isViolatingMasterSymbol', () => {
  it('returns false when entryKind is not file', () => {
    const classification = createClassification({ entryKind: 'directory' });
    const record = createRecord([], []);
    expect(isViolatingMasterSymbol(classification, record)).toBe(false);
  });

  it('returns false when nodeKind is not master-node', () => {
    const classification = createClassification({ nodeKind: 'fragment-node' });
    const record = createRecord([], []);
    expect(isViolatingMasterSymbol(classification, record)).toBe(false);
  });

  it('returns true when master node defines 0 symbols', () => {
    const classification = createClassification();
    const record = createRecord([], []);
    expect(isViolatingMasterSymbol(classification, record)).toBe(true);
  });

  it('returns true when master node defines 2 symbols', () => {
    const classification = createClassification();
    const record = createRecord(
      ['Widget', 'extra'],
      [['Widget', 'local-symbol', 'Widget']]
    );
    expect(isViolatingMasterSymbol(classification, record)).toBe(true);
  });

  it('returns true when master node defines 1 symbol but exports 0 symbols', () => {
    const classification = createClassification();
    const record = createRecord(['Widget'], []);
    expect(isViolatingMasterSymbol(classification, record)).toBe(true);
  });

  it('returns true when master node exports imported binding instead of local symbol', () => {
    const classification = createClassification();
    const record = createRecord(
      ['Widget'],
      [['Widget', 'imported-binding', 'Widget']]
    );
    expect(isViolatingMasterSymbol(classification, record)).toBe(true);
  });

  it('returns true when master node exports local symbol with different name', () => {
    const classification = createClassification();
    const record = createRecord(
      ['Widget'],
      [['Other', 'local-symbol', 'Other']]
    );
    expect(isViolatingMasterSymbol(classification, record)).toBe(true);
  });

  it('returns false when master node defines exactly one symbol and exports it', () => {
    const classification = createClassification();
    const record = createRecord(
      ['Widget'],
      [['Widget', 'local-symbol', 'Widget']]
    );
    expect(isViolatingMasterSymbol(classification, record)).toBe(false);
  });

  it('returns false when master node exports the single symbol with multiple aliases', () => {
    const classification = createClassification();
    const record = createRecord(
      ['Widget'],
      [
        ['Widget', 'local-symbol', 'Widget'],
        ['Renamed', 'local-symbol', 'Widget'],
      ]
    );
    expect(isViolatingMasterSymbol(classification, record)).toBe(false);
  });
});

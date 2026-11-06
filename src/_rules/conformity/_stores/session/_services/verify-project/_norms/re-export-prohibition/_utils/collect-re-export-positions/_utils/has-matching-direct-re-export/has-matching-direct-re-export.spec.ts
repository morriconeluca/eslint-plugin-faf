import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleImport,
} from '../../../../../../../../_session@shared/_types/module-record.type.js';

import { hasMatchingDirectReExport } from './index.js';

describe('hasMatchingDirectReExport', () => {
  const direct: TModuleImport = {
    isTypeOnly: false,
    kind: 'export-named-from',
    position: { column: 1, line: 1 },
    specifier: './source.js',
  };

  it('matches export with matching specifier after statement start', () => {
    const exp: TModuleExport = {
      exportedName: 'value',
      isTypeOnly: false,
      origin: {
        importedName: 'value',
        specifier: './source.js',
        type: 'imported-binding',
      },
      position: { column: 10, line: 1 },
    };
    const handled = new Set<TModuleExport>();

    const hasMatch = hasMatchingDirectReExport(direct, [exp], handled);

    expect(hasMatch).toBe(true);
    expect(handled.has(exp)).toBe(true);
  });

  it('matches export when statement and export coordinates are identical', () => {
    const exp: TModuleExport = {
      exportedName: '*',
      isTypeOnly: false,
      origin: { specifier: './source.js', type: 'export-all' },
      position: { column: 1, line: 1 },
    };
    const handled = new Set<TModuleExport>();

    const hasMatch = hasMatchingDirectReExport(direct, [exp], handled);

    expect(hasMatch).toBe(true);
    expect(handled.has(exp)).toBe(true);
  });

  it('skips already handled exports', () => {
    const exp: TModuleExport = {
      exportedName: 'value',
      isTypeOnly: false,
      origin: {
        importedName: 'value',
        specifier: './source.js',
        type: 'imported-binding',
      },
      position: { column: 10, line: 1 },
    };
    const handled = new Set<TModuleExport>([exp]);

    const hasMatch = hasMatchingDirectReExport(direct, [exp], handled);

    expect(hasMatch).toBe(false);
  });

  it('rejects export with local-symbol origin type', () => {
    const exp: TModuleExport = {
      exportedName: 'value',
      isTypeOnly: false,
      origin: { symbolName: 'value', type: 'local-symbol' },
      position: { column: 10, line: 1 },
    };
    const handled = new Set<TModuleExport>();

    const hasMatch = hasMatchingDirectReExport(direct, [exp], handled);

    expect(hasMatch).toBe(false);
  });

  it('rejects export with different specifier', () => {
    const exp: TModuleExport = {
      exportedName: 'value',
      isTypeOnly: false,
      origin: {
        importedName: 'value',
        specifier: './different.js',
        type: 'imported-binding',
      },
      position: { column: 10, line: 1 },
    };
    const handled = new Set<TModuleExport>();

    const hasMatch = hasMatchingDirectReExport(direct, [exp], handled);

    expect(hasMatch).toBe(false);
  });

  it('rejects export positioned before direct statement start', () => {
    const lateDirect: TModuleImport = {
      isTypeOnly: false,
      kind: 'export-named-from',
      position: { column: 1, line: 2 },
      specifier: './source.js',
    };
    const exp: TModuleExport = {
      exportedName: 'value',
      isTypeOnly: false,
      origin: {
        importedName: 'value',
        specifier: './source.js',
        type: 'imported-binding',
      },
      position: { column: 10, line: 1 },
    };
    const handled = new Set<TModuleExport>();

    const hasMatch = hasMatchingDirectReExport(lateDirect, [exp], handled);

    expect(hasMatch).toBe(false);
  });
});

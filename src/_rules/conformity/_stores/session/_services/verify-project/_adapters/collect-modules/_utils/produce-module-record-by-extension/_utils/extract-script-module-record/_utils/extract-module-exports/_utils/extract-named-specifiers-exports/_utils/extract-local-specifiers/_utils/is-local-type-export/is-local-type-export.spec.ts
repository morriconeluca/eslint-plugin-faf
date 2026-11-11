import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../../../../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

import { isLocalTypeExport } from './is-local-type-export.util.js';

describe('isLocalTypeExport', () => {
  const valueBinding: TImportedBinding = {
    importedName: 'Foo',
    isNamespace: false,
    isTypeOnly: false,
    localName: 'Foo',
    specifier: './dep.js',
  };

  const typeBinding: TImportedBinding = {
    importedName: 'Foo',
    isNamespace: false,
    isTypeOnly: true,
    localName: 'Foo',
    specifier: './dep.js',
  };

  const typeSymbols: readonly TRootSymbol[] = [
    { name: 'Foo', position: { column: 1, line: 1 }, space: 'type' },
  ];

  const valueSymbols: readonly TRootSymbol[] = [
    { name: 'Foo', position: { column: 1, line: 1 }, space: 'value' },
  ];

  const otherTypeSymbols: readonly TRootSymbol[] = [
    { name: 'Other', position: { column: 1, line: 1 }, space: 'type' },
  ];

  it('returns true when export is explicitly type-only, binding is value, and local type exists', () => {
    expect(isLocalTypeExport(true, valueBinding, 'Foo', typeSymbols)).toBe(
      true
    );
  });

  it('returns false when export is not explicitly type-only', () => {
    expect(isLocalTypeExport(false, valueBinding, 'Foo', typeSymbols)).toBe(
      false
    );
  });

  it('returns false when binding is undefined', () => {
    expect(isLocalTypeExport(true, undefined, 'Foo', typeSymbols)).toBe(false);
  });

  it('returns false when binding is already type-only', () => {
    expect(isLocalTypeExport(true, typeBinding, 'Foo', typeSymbols)).toBe(
      false
    );
  });

  it('returns false when local symbol is in value space', () => {
    expect(isLocalTypeExport(true, valueBinding, 'Foo', valueSymbols)).toBe(
      false
    );
  });

  it('returns false when local symbol has different name', () => {
    expect(isLocalTypeExport(true, valueBinding, 'Foo', otherTypeSymbols)).toBe(
      false
    );
  });

  it('returns false when rootSymbols is empty', () => {
    expect(isLocalTypeExport(true, valueBinding, 'Foo', [])).toBe(false);
  });
});

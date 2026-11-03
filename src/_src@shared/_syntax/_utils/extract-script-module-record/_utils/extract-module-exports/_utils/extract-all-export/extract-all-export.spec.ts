import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractAllExport } from './index.js';

describe('extractAllExport', () => {
  it('extracts unaliased export all (*)', () => {
    const code = "export * from './dep.js';";
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportAllDeclaration',
      'Expected export all'
    );
    const locator = createSourceLocator(code);

    const exported = extractAllExport(statement, locator);

    expect(exported).toEqual({
      exportedName: '*',
      isTypeOnly: false,
      origin: { specifier: './dep.js', type: 'export-all' },
      position: { column: 1, line: 1 },
    });
  });

  it('extracts aliased export all (export * as ns)', () => {
    const code = "export * as ns from './dep.js';";
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportAllDeclaration',
      'Expected export all'
    );
    const locator = createSourceLocator(code);

    const exported = extractAllExport(statement, locator);

    expect(exported).toEqual({
      exportedName: 'ns',
      isTypeOnly: false,
      origin: { specifier: './dep.js', type: 'namespace' },
      position: { column: 1, line: 1 },
    });
  });

  it('marks export all as type-only when exportKind is type', () => {
    const code = "export type * from './dep.js';";
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportAllDeclaration',
      'Expected export all'
    );
    const locator = createSourceLocator(code);

    const exported = extractAllExport(statement, locator);

    expect(exported.isTypeOnly).toBe(true);
  });
});

import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { getExportedName } from './get-exported-name.util.js';

describe('getExportedName', () => {
  it('extracts name from identifier node', () => {
    const result = parseSync('test.ts', 'export { foo };', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    const specifier = statement.specifiers[0];
    assertInvariant(specifier !== undefined, 'Expected specifier');

    expect(getExportedName(specifier.exported)).toBe('foo');
  });

  it('extracts value from string literal node', () => {
    const result = parseSync('test.ts', "export { foo as 'string-literal' };", {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    const specifier = statement.specifiers[0];
    assertInvariant(specifier !== undefined, 'Expected specifier');

    expect(getExportedName(specifier.exported)).toBe('string-literal');
  });
});

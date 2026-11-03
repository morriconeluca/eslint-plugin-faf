import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TExtractedImportEquals } from './extract-import-equals.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { extractImportEquals } from './index.js';

const parseImportEquals = (code: string): null | TExtractedImportEquals => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'TSImportEqualsDeclaration',
    'Expected TSImportEqualsDeclaration'
  );
  const locator = createSourceLocator(code);
  return extractImportEquals(statement, locator);
};

describe('extractImportEquals', () => {
  it('extracts external module reference correctly', () => {
    const result = parseImportEquals("import legacy = require('./legacy.js');");
    expect(result).toEqual({
      binding: {
        importedName: 'default',
        isNamespace: false,
        isTypeOnly: false,
        localName: 'legacy',
        specifier: './legacy.js',
      },
      staticImport: {
        isTypeOnly: false,
        kind: 'typescript-require-import',
        position: { column: 1, line: 1 },
        specifier: './legacy.js',
      },
    });
  });

  it('marks isTypeOnly true when declaration is import type', () => {
    const result = parseImportEquals(
      "import type legacy = require('./legacy.js');"
    );
    assertInvariant(result !== null, 'Expected result to be non-null');
    expect(result.binding.isTypeOnly).toBe(true);
    expect(result.staticImport.isTypeOnly).toBe(true);
  });

  it('returns null for internal entity reference', () => {
    const result = parseImportEquals('import internal = MyNamespace.Entity;');
    expect(result).toBeNull();
  });
});

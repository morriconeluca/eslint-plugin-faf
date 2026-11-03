import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { createSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractParseErrors } from './index.js';

describe('extractParseErrors', () => {
  it('extracts error position using first label start', () => {
    const code = 'const =;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const locator = createSourceLocator(code);
    const parseErrors = extractParseErrors(result.errors, locator);

    expect(parseErrors).toHaveLength(1);
    expect(parseErrors[0]?.position).toEqual({ column: 7, line: 1 });
  });

  it('falls back to position 0 when labels are empty', () => {
    const code = 'const =;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const locator = createSourceLocator(code);
    const errorWithEmptyLabels = result.errors.map((error) => ({
      ...error,
      labels: [],
    }));
    const parseErrors = extractParseErrors(errorWithEmptyLabels, locator);

    expect(parseErrors[0]?.position).toEqual({ column: 1, line: 1 });
  });
});

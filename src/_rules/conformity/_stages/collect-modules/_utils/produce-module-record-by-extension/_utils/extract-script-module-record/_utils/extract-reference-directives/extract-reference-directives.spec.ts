import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { createSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractReferenceDirectives } from './extract-reference-directives.util.js';

const parseCommentsAndExtract = (sourceText: string) => {
  const result = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(sourceText);
  return extractReferenceDirectives(result.comments, locator);
};

describe('extractReferenceDirectives', () => {
  it('extracts double-quoted and single-quoted triple-slash reference path directives', () => {
    const code = [
      '/// <reference path="../../configs/globals.d.ts" />',
      "///<reference path='local.d.ts'/>",
      '///   <reference   path = "./sub/types.d.ts"   />  ',
    ].join('\n');

    expect(parseCommentsAndExtract(code)).toEqual([
      {
        isTypeOnly: true,
        kind: 'typescript-reference-path',
        position: { column: 1, line: 1 },
        specifier: '../../configs/globals.d.ts',
      },
      {
        isTypeOnly: true,
        kind: 'typescript-reference-path',
        position: { column: 1, line: 2 },
        specifier: 'local.d.ts',
      },
      {
        isTypeOnly: true,
        kind: 'typescript-reference-path',
        position: { column: 1, line: 3 },
        specifier: './sub/types.d.ts',
      },
    ]);
  });

  it('extracts triple-slash path directives appearing after imports', () => {
    const code = [
      "import { value } from './value.js';",
      '',
      '/// <reference path="./after-imports.d.ts" />',
      'export const result = value;',
    ].join('\n');

    expect(parseCommentsAndExtract(code)).toEqual([
      {
        isTypeOnly: true,
        kind: 'typescript-reference-path',
        position: { column: 1, line: 3 },
        specifier: './after-imports.d.ts',
      },
    ]);
  });

  it('ignores types, lib, no-default-lib, four-slash, double-slash, block, and empty path comments', () => {
    const code = [
      '/// <reference types="node" />',
      "/// <reference lib='es2022' />",
      '/// <reference no-default-lib="true" />',
      '/// <reference path="" />',
      '//// <reference path="./four-slash.d.ts" />',
      '// <reference path="./double-slash.d.ts" />',
      '/* / <reference path="./block.d.ts" /> */',
      '/// some prose mentioning <reference path="./prose.d.ts" />',
      'const text = \'/// <reference path="./in-string.d.ts" />\';',
    ].join('\n');

    expect(parseCommentsAndExtract(code)).toEqual([]);
  });
});

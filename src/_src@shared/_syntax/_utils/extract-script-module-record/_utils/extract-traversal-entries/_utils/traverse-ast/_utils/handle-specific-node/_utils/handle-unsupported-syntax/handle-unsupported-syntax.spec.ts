import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TUnsupportedSyntax } from '../../../../../../../../../../_types/module-record.type.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { createSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleUnsupportedSyntax } from './index.js';

describe('handleUnsupportedSyntax', () => {
  it('reports unsupported syntax for TSExportAssignment with start offset', () => {
    const code = 'export = legacy;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      ...statement,
      start: 0,
      type: 'TSExportAssignment',
    };

    handleUnsupportedSyntax(node, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description: 'TypeScript export assignment (export =) is unsupported',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('reports unsupported syntax for TSExportAssignment when start is missing', () => {
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      type: 'TSExportAssignment',
    };

    handleUnsupportedSyntax(node, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description: 'TypeScript export assignment (export =) is unsupported',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('reports unsupported syntax for ambient module declaration', () => {
    const code = 'declare module "ambient" {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      ...statement,
      kind: 'module',
      start: 5,
      type: 'TSModuleDeclaration',
    };

    handleUnsupportedSyntax(node, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description:
          'Ambient module or global augmentation (declare module / declare global) is unsupported',
        position: { column: 6, line: 1 },
      },
    ]);
  });

  it('reports unsupported syntax for global augmentation', () => {
    const code = 'declare global {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      ...statement,
      kind: 'global',
      start: 0,
      type: 'TSModuleDeclaration',
    };

    handleUnsupportedSyntax(node, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(1);
  });

  it('ignores other supported node types', () => {
    const node: TAstNode = { type: 'VariableDeclaration' };
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

    handleUnsupportedSyntax(node, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });
});

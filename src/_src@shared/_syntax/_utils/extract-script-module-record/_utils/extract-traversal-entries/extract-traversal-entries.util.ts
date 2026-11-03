import type { Program } from 'oxc-parser';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TTraversalResult } from './extract-traversal-entries.type.js';

import { traverseAst } from './_utils/traverse-ast/index.js';

export function extractTraversalEntries(
  program: Program,
  locator: TSourceLocator
): TTraversalResult {
  const inlineImports: TModuleImport[] = [];
  const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

  traverseAst(program, false, locator, inlineImports, unsupportedSyntaxes);

  return {
    inlineImports,
    unsupportedSyntaxes,
  };
}

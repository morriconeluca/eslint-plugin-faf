import type { Program } from 'oxc-parser';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { doesNodeDeclareRequire } from '../does-node-declare-require/index.js';
import { handleSpecificNode } from './_utils/handle-specific-node/index.js';
import { visitChildren } from './_utils/visit-children/index.js';

export function traverseAst(
  node: Program | TAstNode,
  isRequireShadowed: boolean,
  locator: TSourceLocator,
  inlineImports: TModuleImport[],
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  const astNode: TAstNode = { ...node, type: node.type };
  const isNextShadowed = isRequireShadowed || doesNodeDeclareRequire(astNode);

  handleSpecificNode(
    astNode,
    isNextShadowed,
    locator,
    inlineImports,
    unsupportedSyntaxes
  );

  visitChildren(astNode, (child) => {
    traverseAst(
      child,
      isNextShadowed,
      locator,
      inlineImports,
      unsupportedSyntaxes
    );
  });
}

import type { Program } from 'oxc-parser';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { doesNodeDeclareRequire } from './_utils/does-node-declare-require/index.js';
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

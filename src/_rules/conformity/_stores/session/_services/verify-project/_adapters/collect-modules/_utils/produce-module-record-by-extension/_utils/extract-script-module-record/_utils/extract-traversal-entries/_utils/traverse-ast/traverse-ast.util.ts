import type { Program } from 'oxc-parser';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  EXPORTS_NAME,
  MODULE_NAME,
  REQUIRE_NAME,
} from './_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { doesNodeDeclareRequire } from './_utils/does-node-declare-require/index.js';
import { handleSpecificNode } from './_utils/handle-specific-node/index.js';
import { visitChildren } from './_utils/visit-children/index.js';

export function traverseAst(
  node: Program | TAstNode,
  isRequireShadowed: boolean,
  isModuleShadowed: boolean,
  isExportsShadowed: boolean,
  locator: TSourceLocator,
  inlineImports: TModuleImport[],
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  const astNode: TAstNode = { ...node, type: node.type };
  const isNextRequireShadowed =
    isRequireShadowed || doesNodeDeclareRequire(astNode, REQUIRE_NAME);
  const isNextModuleShadowed =
    isModuleShadowed || doesNodeDeclareRequire(astNode, MODULE_NAME);
  const isNextExportsShadowed =
    isExportsShadowed || doesNodeDeclareRequire(astNode, EXPORTS_NAME);

  handleSpecificNode(
    astNode,
    isNextRequireShadowed,
    isNextModuleShadowed,
    isNextExportsShadowed,
    locator,
    inlineImports,
    unsupportedSyntaxes
  );

  visitChildren(astNode, (child) => {
    traverseAst(
      child,
      isNextRequireShadowed,
      isNextModuleShadowed,
      isNextExportsShadowed,
      locator,
      inlineImports,
      unsupportedSyntaxes
    );
  });
}

import type { Program } from 'oxc-parser';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from './_extract-traversal-entries@shared/_types/traversal-entries.type.js';
import type { TTraversalResult } from './extract-traversal-entries.type.js';

import {
  EXPORTS_NAME,
  MODULE_NAME,
  REQUIRE_NAME,
} from './_extract-traversal-entries@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from './_extract-traversal-entries@shared/_utils/is-ast-node/index.js';
import { doesNodeDeclareRequire } from './_utils/does-node-declare-require/index.js';
import { handleSpecificNode } from './_utils/handle-specific-node/index.js';

export const extractTraversalEntries = (() => {
  const visitChildren = (
    node: TAstNode,
    visitor: (child: TAstNode) => void
  ): void => {
    const elements = Object.values(node).flat();
    for (const item of elements) {
      if (isAstNode(item)) {
        visitor(item);
      }
    }
  };

  const traverseAst = (
    node: Program | TAstNode,
    isRequireShadowed: boolean,
    isModuleShadowed: boolean,
    isExportsShadowed: boolean,
    locator: TSourceLocator,
    inlineImports: TModuleImport[],
    unsupportedSyntaxes: TUnsupportedSyntax[]
  ): void => {
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
  };

  return function extractTraversalEntries(
    program: Program,
    locator: TSourceLocator
  ): TTraversalResult {
    const inlineImports: TModuleImport[] = [];
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

    traverseAst(
      program,
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupportedSyntaxes
    );

    return {
      inlineImports,
      unsupportedSyntaxes,
    };
  };
})();

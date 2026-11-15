import type { TemplateLiteral } from 'oxc-parser';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  EXPORTS_NAME,
  MODULE_NAME,
  REQUIRE_NAME,
  UNSUPPORTED_COMMONJS_MESSAGE,
  UNSUPPORTED_REQUIRE_MESSAGE,
} from '../../_extract-traversal-entries@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../_extract-traversal-entries@shared/_utils/is-ast-node/index.js';

export const handleSpecificNode = (() => {
  const isTemplateLiteral = (node: {
    readonly type: string;
  }): node is TemplateLiteral => node.type === 'TemplateLiteral';

  const extractTemplateSpecifier = (node: TemplateLiteral): null | string => {
    if (node.expressions.length > 0) {
      return null;
    }
    const quasi = node.quasis[0];
    return quasi === undefined ? null : (quasi.value.cooked ?? quasi.value.raw);
  };

  const extractStaticSpecifier = (node: {
    readonly type: string;
  }): null | string => {
    if (
      node.type === 'Literal' &&
      'value' in node &&
      typeof node.value === 'string'
    ) {
      return node.value;
    }

    if (isTemplateLiteral(node)) {
      return extractTemplateSpecifier(node);
    }

    return null;
  };

  const handleImportExpression = (
    expression: TAstNode,
    locator: TSourceLocator,
    inlineImports: TModuleImport[]
  ): void => {
    const start =
      typeof expression['start'] === 'number' ? expression['start'] : 0;
    const position = locator(start);
    const source = expression['source'];
    const specifier = isAstNode(source) ? extractStaticSpecifier(source) : null;

    if (specifier !== null) {
      inlineImports.push({
        isTypeOnly: false,
        kind: 'literal-dynamic-import',
        position,
        specifier,
      });
      return;
    }

    inlineImports.push({
      isTypeOnly: false,
      kind: 'non-literal-dynamic-import',
      position,
      specifier: null,
    });
  };

  const handleRequireCall = (
    call: TAstNode,
    locator: TSourceLocator,
    inlineImports: TModuleImport[],
    unsupportedSyntaxes: TUnsupportedSyntax[]
  ): void => {
    const start = typeof call['start'] === 'number' ? call['start'] : 0;
    const position = locator(start);
    const callArguments = call['arguments'];
    const isSingleElement = (
      value: null | object
    ): value is readonly [unknown] =>
      value === callArguments && Array.isArray(value) && value.length === 1;

    if (typeof callArguments !== 'object' || !isSingleElement(callArguments)) {
      unsupportedSyntaxes.push({
        description: UNSUPPORTED_REQUIRE_MESSAGE,
        position,
      });
      return;
    }

    const argument = callArguments[0];
    const specifier = isAstNode(argument)
      ? extractStaticSpecifier(argument)
      : null;
    if (specifier !== null) {
      inlineImports.push({
        isTypeOnly: false,
        kind: 'require-call',
        position,
        specifier,
      });
      return;
    }

    unsupportedSyntaxes.push({
      description: UNSUPPORTED_REQUIRE_MESSAGE,
      position,
    });
  };

  const handleTsImportType = (
    importType: TAstNode,
    locator: TSourceLocator,
    inlineImports: TModuleImport[]
  ): void => {
    const start =
      typeof importType['start'] === 'number' ? importType['start'] : 0;
    const position = locator(start);
    const source = importType['source'];
    const specifier =
      isAstNode(source) && typeof source['value'] === 'string'
        ? source['value']
        : '';
    inlineImports.push({
      isTypeOnly: true,
      kind: 'typescript-import-type',
      position,
      specifier,
    });
  };

  const isExportsProperty = (node: TAstNode): boolean => {
    const property = node['property'];
    if (!isAstNode(property)) {
      return false;
    }

    if (node['computed'] === true) {
      return extractStaticSpecifier(property) === EXPORTS_NAME;
    }

    return property.type === 'Identifier' && property['name'] === EXPORTS_NAME;
  };

  const isCommonJsExportAssignment = (
    left: TAstNode,
    isModuleShadowed: boolean,
    isExportsShadowed: boolean
  ): boolean => {
    if (left.type !== 'MemberExpression') {
      return false;
    }

    let current: TAstNode = left;
    let innermostOnModule: null | TAstNode = null;

    while (current.type === 'MemberExpression') {
      const object = current['object'];
      if (!isAstNode(object)) {
        return false;
      }
      if (object.type === 'Identifier') {
        if (object['name'] === EXPORTS_NAME) {
          return !isExportsShadowed;
        }
        if (object['name'] === MODULE_NAME) {
          innermostOnModule = current;
        }
      }
      current = object;
    }

    return (
      innermostOnModule !== null &&
      !isModuleShadowed &&
      isExportsProperty(innermostOnModule)
    );
  };

  const handleUnsupportedSyntax = (
    node: TAstNode,
    isModuleShadowed: boolean,
    isExportsShadowed: boolean,
    locator: TSourceLocator,
    unsupportedSyntaxes: TUnsupportedSyntax[]
  ): void => {
    if (node.type === 'TSExportAssignment') {
      const start = typeof node['start'] === 'number' ? node['start'] : 0;
      unsupportedSyntaxes.push({
        description: 'TypeScript export assignment (export =) is unsupported',
        position: locator(start),
      });
      return;
    }

    if (node.type !== 'AssignmentExpression') {
      return;
    }

    const left = node['left'];
    if (
      !isAstNode(left) ||
      !isCommonJsExportAssignment(left, isModuleShadowed, isExportsShadowed)
    ) {
      return;
    }

    const start = typeof node['start'] === 'number' ? node['start'] : 0;
    unsupportedSyntaxes.push({
      description: UNSUPPORTED_COMMONJS_MESSAGE,
      position: locator(start),
    });
  };

  return function handleSpecificNode(
    node: TAstNode,
    isRequireShadowed: boolean,
    isModuleShadowed: boolean,
    isExportsShadowed: boolean,
    locator: TSourceLocator,
    inlineImports: TModuleImport[],
    unsupportedSyntaxes: TUnsupportedSyntax[]
  ): void {
    if (node.type === 'CallExpression') {
      const callee = node['callee'];
      if (
        !isRequireShadowed &&
        isAstNode(callee) &&
        callee.type === 'Identifier' &&
        callee['name'] === REQUIRE_NAME
      ) {
        handleRequireCall(node, locator, inlineImports, unsupportedSyntaxes);
      }
      return;
    }

    if (node.type === 'ImportExpression') {
      handleImportExpression(node, locator, inlineImports);
      return;
    }

    if (node.type === 'TSImportType') {
      handleTsImportType(node, locator, inlineImports);
      return;
    }

    handleUnsupportedSyntax(
      node,
      isModuleShadowed,
      isExportsShadowed,
      locator,
      unsupportedSyntaxes
    );
  };
})();

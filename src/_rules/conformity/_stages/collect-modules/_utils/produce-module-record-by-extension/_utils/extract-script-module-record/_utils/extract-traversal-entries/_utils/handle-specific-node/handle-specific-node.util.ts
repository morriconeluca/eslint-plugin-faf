import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { isPlainRecord } from '../../../../../../../../../../../../_src@shared/_utils/is-plain-record/index.js';
import {
  EXPORTS_NAME,
  MODULE_NAME,
  REQUIRE_NAME,
  UNSUPPORTED_COMMONJS_MESSAGE,
  UNSUPPORTED_REQUIRE_MESSAGE,
} from '../../_extract-traversal-entries@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../_extract-traversal-entries@shared/_utils/is-ast-node/index.js';

export function handleSpecificNode(
  node: TAstNode,
  isRequireShadowed: boolean,
  isModuleShadowed: boolean,
  isExportsShadowed: boolean,
  locator: TSourceLocator,
  inlineImports: TModuleImport[],
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  const extractStaticSpecifier = (candidate: TAstNode): null | string => {
    if (candidate.type === 'Literal') {
      return typeof candidate['value'] === 'string' ? candidate['value'] : null;
    }

    if (candidate.type !== 'TemplateLiteral') {
      return null;
    }

    const extractTemplateSpecifier = (): null | string => {
      const expressions = candidate['expressions'];
      const quasis = candidate['quasis'];
      if (
        !Array.isArray(expressions) ||
        expressions.length > 0 ||
        !Array.isArray(quasis)
      ) {
        return null;
      }
      const quasi: unknown = quasis[0];
      const value = isPlainRecord(quasi) ? quasi['value'] : undefined;
      const text = isPlainRecord(value)
        ? (value['cooked'] ?? value['raw'])
        : undefined;
      return typeof text === 'string' ? text : null;
    };

    return extractTemplateSpecifier();
  };

  const handleImportExpression = (expression: TAstNode): void => {
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

  const handleRequireCall = (call: TAstNode): void => {
    const start = typeof call['start'] === 'number' ? call['start'] : 0;
    const position = locator(start);
    const callArguments = call['arguments'];
    if (!Array.isArray(callArguments) || callArguments.length !== 1) {
      unsupportedSyntaxes.push({
        description: UNSUPPORTED_REQUIRE_MESSAGE,
        position,
      });
      return;
    }

    const argument: unknown = callArguments[0];
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

  const handleTsImportType = (importType: TAstNode): void => {
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

  const isExportsProperty = (member: TAstNode): boolean => {
    const property = member['property'];
    if (!isAstNode(property)) {
      return false;
    }

    if (member['computed'] === true) {
      return extractStaticSpecifier(property) === EXPORTS_NAME;
    }

    return property.type === 'Identifier' && property['name'] === EXPORTS_NAME;
  };

  const isCommonJsExportAssignment = (left: TAstNode): boolean => {
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

  const handleUnsupportedSyntax = (target: TAstNode): void => {
    if (target.type === 'TSExportAssignment') {
      const start = typeof target['start'] === 'number' ? target['start'] : 0;
      unsupportedSyntaxes.push({
        description: 'TypeScript export assignment (export =) is unsupported',
        position: locator(start),
      });
      return;
    }

    if (target.type !== 'AssignmentExpression') {
      return;
    }

    const left = target['left'];
    if (!isAstNode(left) || !isCommonJsExportAssignment(left)) {
      return;
    }

    const start = typeof target['start'] === 'number' ? target['start'] : 0;
    unsupportedSyntaxes.push({
      description: UNSUPPORTED_COMMONJS_MESSAGE,
      position: locator(start),
    });
  };

  switch (node.type) {
    case 'CallExpression': {
      const callee = node['callee'];
      if (
        !isRequireShadowed &&
        isAstNode(callee) &&
        callee.type === 'Identifier' &&
        callee['name'] === REQUIRE_NAME
      ) {
        handleRequireCall(node);
      }
      return;
    }
    case 'ImportExpression': {
      handleImportExpression(node);
      return;
    }
    case 'TSImportType': {
      handleTsImportType(node);
      return;
    }
    default: {
      handleUnsupportedSyntax(node);
    }
  }
}

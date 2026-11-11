import { describe, expect, it } from 'vitest';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleSpecificNode } from './handle-specific-node.util.js';

describe('handleSpecificNode', () => {
  it('handles require call expression when not shadowed', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      arguments: [{ type: 'Literal', value: './dep.js' }],
      callee: { name: 'require', type: 'Identifier' },
      start: 0,
      type: 'CallExpression',
    };

    handleSpecificNode(
      node,
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports).toHaveLength(1);
    expect(inlineImports[0]?.kind).toBe('require-call');
  });

  it('skips require call expression when shadowed', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      arguments: [{ type: 'Literal', value: './dep.js' }],
      callee: { name: 'require', type: 'Identifier' },
      start: 0,
      type: 'CallExpression',
    };

    handleSpecificNode(
      node,
      true,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports).toHaveLength(0);
  });

  it('handles dynamic import expression', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      source: { type: 'Literal', value: './dynamic.js' },
      start: 0,
      type: 'ImportExpression',
    };

    handleSpecificNode(
      node,
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports).toHaveLength(1);
    expect(inlineImports[0]?.kind).toBe('literal-dynamic-import');
  });

  it('handles ts import type', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      source: { value: './types.js' },
      start: 0,
      type: 'TSImportType',
    };

    handleSpecificNode(
      node,
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports).toHaveLength(1);
    expect(inlineImports[0]?.kind).toBe('typescript-import-type');
  });

  it('handles unsupported syntax for export =', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      start: 0,
      type: 'TSExportAssignment',
    };

    handleSpecificNode(
      node,
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(unsupported).toHaveLength(1);
  });

  it('handles unsupported syntax for module.exports assignment', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      left: {
        computed: false,
        object: { name: 'module', type: 'Identifier' },
        property: { name: 'exports', type: 'Identifier' },
        type: 'MemberExpression',
      },
      start: 0,
      type: 'AssignmentExpression',
    };

    handleSpecificNode(
      node,
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(unsupported).toHaveLength(1);
  });

  it('skips module.exports assignment when module is shadowed', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      left: {
        computed: false,
        object: { name: 'module', type: 'Identifier' },
        property: { name: 'exports', type: 'Identifier' },
        type: 'MemberExpression',
      },
      start: 0,
      type: 'AssignmentExpression',
    };

    handleSpecificNode(
      node,
      false,
      true,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(unsupported).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleSpecificNode } from './handle-specific-node.util.js';

describe('handleSpecificNode', () => {
  it('handles literal, template, and invalid require call expressions', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];

    handleSpecificNode(
      {
        arguments: [{ type: 'Literal', value: './dep.js' }],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    expect(inlineImports).toHaveLength(1);
    expect(inlineImports[0]?.kind).toBe('require-call');

    handleSpecificNode(
      {
        arguments: [
          {
            expressions: [],
            quasis: [{ value: { cooked: './tmpl.js', raw: './tmpl.js' } }],
            type: 'TemplateLiteral',
          },
        ],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    expect(inlineImports[1]?.specifier).toBe('./tmpl.js');

    handleSpecificNode(
      {
        arguments: [{ type: 'Identifier', value: 'dyn' }],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        arguments: [],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    expect(unsupported).toHaveLength(2);
  });

  it('skips require call expression when shadowed', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];

    handleSpecificNode(
      {
        arguments: [{ type: 'Literal', value: './dep.js' }],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      true,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports).toHaveLength(0);
  });

  it('handles literal and non-literal dynamic import expressions and ts import type', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];

    handleSpecificNode(
      {
        source: { type: 'Literal', value: './dynamic.js' },
        start: 0,
        type: 'ImportExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        source: {
          expressions: [{ type: 'Identifier' }],
          quasis: [],
          type: 'TemplateLiteral',
        },
        start: 0,
        type: 'ImportExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        source: { value: './types.js' },
        start: 0,
        type: 'TSImportType',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports.map((item) => item.kind)).toEqual([
      'literal-dynamic-import',
      'non-literal-dynamic-import',
      'typescript-import-type',
    ]);
  });

  it('handles unsupported syntax for export = and CommonJS assignments including computed module["exports"]', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];

    const nodes: readonly TAstNode[] = [
      { start: 0, type: 'TSExportAssignment' },
      {
        left: {
          computed: false,
          object: { name: 'module', type: 'Identifier' },
          property: { name: 'exports', type: 'Identifier' },
          type: 'MemberExpression',
        },
        start: 0,
        type: 'AssignmentExpression',
      },
      {
        left: {
          computed: true,
          object: { name: 'module', type: 'Identifier' },
          property: { type: 'Literal', value: 'exports' },
          type: 'MemberExpression',
        },
        start: 0,
        type: 'AssignmentExpression',
      },
      {
        left: {
          computed: false,
          object: { name: 'exports', type: 'Identifier' },
          property: { name: 'x', type: 'Identifier' },
          type: 'MemberExpression',
        },
        start: 0,
        type: 'AssignmentExpression',
      },
    ];

    for (const node of nodes) {
      handleSpecificNode(
        node,
        false,
        false,
        false,
        locator,
        inlineImports,
        unsupported
      );
    }

    expect(unsupported).toHaveLength(4);

    const skippedUnsupported: TUnsupportedSyntax[] = [];
    handleSpecificNode(
      nodes[1] ?? { type: 'AssignmentExpression' },
      false,
      true,
      false,
      locator,
      inlineImports,
      skippedUnsupported
    );
    handleSpecificNode(
      nodes[3] ?? { type: 'AssignmentExpression' },
      false,
      false,
      true,
      locator,
      inlineImports,
      skippedUnsupported
    );
    expect(skippedUnsupported).toHaveLength(0);

    const nonViolatingNodes: readonly TAstNode[] = [
      {
        arguments: [],
        callee: { name: 'other', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      {
        source: null,
        start: 0,
        type: 'ImportExpression',
      },
      {
        left: { name: 'local', type: 'Identifier' },
        start: 0,
        type: 'AssignmentExpression',
      },
      {
        left: {
          computed: false,
          object: null,
          property: { name: 'x', type: 'Identifier' },
          type: 'MemberExpression',
        },
        start: 0,
        type: 'AssignmentExpression',
      },
      {
        left: {
          computed: false,
          object: { name: 'module', type: 'Identifier' },
          property: null,
          type: 'MemberExpression',
        },
        start: 0,
        type: 'AssignmentExpression',
      },
      {
        left: {
          computed: false,
          object: { name: 'other', type: 'Identifier' },
          property: { name: 'x', type: 'Identifier' },
          type: 'MemberExpression',
        },
        start: 0,
        type: 'AssignmentExpression',
      },
    ];
    const ignoredImports: TModuleImport[] = [];
    const ignoredUnsupported: TUnsupportedSyntax[] = [];
    for (const node of nonViolatingNodes) {
      handleSpecificNode(
        node,
        false,
        false,
        false,
        locator,
        ignoredImports,
        ignoredUnsupported
      );
    }
    expect(ignoredImports.map((item) => item.kind)).toEqual([
      'non-literal-dynamic-import',
    ]);
    expect(ignoredUnsupported).toEqual([]);
  });

  it('handles defensive AST shapes for templates, require arguments, TSImportType, and missing positions', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupported: TUnsupportedSyntax[] = [];

    handleSpecificNode(
      {
        arguments: [
          {
            expressions: [],
            quasis: [{ value: { cooked: null, raw: './raw-fallback.js' } }],
            type: 'TemplateLiteral',
          },
        ],
        callee: { name: 'require', type: 'Identifier' },
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    expect(inlineImports[0]?.specifier).toBe('./raw-fallback.js');

    handleSpecificNode(
      {
        arguments: [
          {
            expressions: [],
            quasis: [],
            type: 'TemplateLiteral',
          },
        ],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        arguments: [
          {
            expressions: [],
            quasis: [{ value: { cooked: 123, raw: 456 } }],
            type: 'TemplateLiteral',
          },
        ],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        arguments: [null],
        callee: { name: 'require', type: 'Identifier' },
        start: 0,
        type: 'CallExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        source: null,
        type: 'TSImportType',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      { type: 'TSExportAssignment' },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );
    handleSpecificNode(
      {
        left: {
          computed: false,
          object: { name: 'exports', type: 'Identifier' },
          property: { name: 'x', type: 'Identifier' },
          type: 'MemberExpression',
        },
        type: 'AssignmentExpression',
      },
      false,
      false,
      false,
      locator,
      inlineImports,
      unsupported
    );

    expect(inlineImports[1]?.specifier).toBe('');
    expect(unsupported).toHaveLength(5);
  });
});

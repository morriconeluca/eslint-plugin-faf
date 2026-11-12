import { describe, expect, expectTypeOf, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TConfigConstraint,
  TResult,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { validateConfigFormat } from './validate-config-format.util.js';

const FAF_NEXT_EXAMPLE_CONFIG = {
  faf: {
    common: {
      aliases: {
        '#/_apis@shared': 'src/_src@shared/_network/_apis/_apis@shared',
        '#/_src@shared': 'src/_src@shared',
      },
      foreignNodes: [
        {
          paths: ['src', 'packages/contracts/src', 'packages/formatters/src'],
          patterns: ['*.md'],
        },
      ],
      horizontalHierarchies: [
        [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
        [
          ['_primitives'],
          ['_compounds'],
          ['_aggregates'],
          ['_systems'],
          ['_ecosystems'],
        ],
      ],
      roles: [
        [
          {
            category: '_fonts',
            implicitRoleExtensions: ['.ttf', '.woff', '.woff2'],
            name: 'font',
          },
          {
            category: '_images',
            implicitRoleExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
            name: 'image',
          },
        ],
        {
          category: '_styles',
          implicitRoleExtensions: ['.css'],
          name: 'style',
        },
        {
          allowMultipleSymbols: true,
          category: '_constants',
          isCategoryNode: true,
          name: 'constant',
        },
        { allowMultipleSymbols: true, category: '_recipes', name: 'recipe' },
        {
          allowMultipleSymbols: true,
          category: '_schemas',
          isCategoryNode: true,
          name: 'schema',
        },
        {
          allowMultipleSymbols: true,
          category: '_types',
          isCategoryNode: true,
          name: 'type',
        },
        {
          allowMultipleSymbols: true,
          category: '_mocks',
          isCategoryNode: true,
          name: 'mock',
        },
        { allowMultipleSymbols: true, category: '_configs', name: 'config' },
        { allowMultipleSymbols: true, category: '_utils', name: 'util' },
        { category: '_classes', name: 'class' },
        { category: '_factories', name: 'factory' },
        { category: '_instances', name: 'instance' },
        { category: '_hooks', name: 'hook' },
        [
          { category: '_apis', name: 'api' },
          { category: '_boundaries', name: 'boundary' },
          { category: '_components', name: 'component' },
          { category: '_contexts', name: 'context' },
          { category: '_layouts', name: 'layout' },
          { category: '_pages', name: 'page' },
          { category: '_routes', name: 'route' },
          { category: '_stores', name: 'store' },
        ],
      ],
      subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
    },
    locals: [
      {
        externalDependencies: [
          {
            from: [
              'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
            ],
            to: ['legacy/client.ts'],
          },
        ],
        foreignDomains: ['src/_configs'],
        foreignNodes: [
          'src/vite-env.d.ts',
          { paths: ['src'], patterns: ['*.md'] },
        ],
        localHorizontalHierarchies: [
          {
            hierarchies: [['_domain'], ['_network', '_state', '_ui']],
            paths: ['src/_src@shared'],
          },
          {
            hierarchies: [['_types'], ['_classes'], ['_utils'], ['_apis']],
            paths: ['src/_src@shared/_network'],
          },
          {
            hierarchies: [
              ['_constants'],
              ['_types'],
              ['_utils'],
              ['_recipes'],
              ['_components'],
              ['_pages'],
            ],
            paths: ['src/_src@shared/_ui'],
          },
        ],
        mimeticPathStructures: [
          {
            actions: ['get', 'list', 'delete', 'post', 'put', 'patch'],
            paths: ['src/_src@shared/_network/_apis'],
          },
        ],
        publicRootNodes: ['src/app/app.tsx'],
        rootFragments: [
          {
            dependencyEdges: [
              {
                from: ['main.tsx'],
                to: ['src/app/app.tsx'],
              },
            ],
            path: 'src',
            rootNodes: [['main.css'], ['main.tsx']],
            subRootFragments: [
              {
                path: 'src/app',
                rootNodes: [['app.tsx']],
              },
            ],
          },
        ],
        treeDependencies: [
          {
            from: ['src'],
            to: ['packages/contracts/src', 'packages/formatters/src'],
          },
        ],
      },
      {
        horizontalHierarchies: [[['_types'], ['_utils']]],
        rootLayers: ['packages/contracts/src', 'packages/formatters/src'],
      },
    ],
  },
};

describe('validateConfigFormat', () => {
  it('returns TResult<TFAFConfig>', () => {
    expectTypeOf<ReturnType<typeof validateConfigFormat>>().toEqualTypeOf<
      TResult<TFAFConfig>
    >();
    const result = validateConfigFormat(FAF_NEXT_EXAMPLE_CONFIG);
    expect(result.ok).toBe(true);
  });

  it('validates the literal faf_next fafconfig.ts successfully', () => {
    const result = validateConfigFormat(FAF_NEXT_EXAMPLE_CONFIG);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(FAF_NEXT_EXAMPLE_CONFIG);
    }
  });

  it('accepts a local catalog with allowMultipleSymbols, general hierarchies, and rootFragments with rootNodes', () => {
    const config = {
      faf: {
        locals: [
          {
            externalDependencies: [
              { from: ['src/main.ts'], to: ['package.json'] },
            ],
            horizontalHierarchies: [
              [
                ['_constants'],
                ['_types'],
                ['_mocks'],
                ['_configs'],
                ['_schemas'],
                ['_utils'],
                ['_norms'],
                ['_adapters'],
                ['_services'],
                ['_stores'],
                ['_rules'],
              ],
              [
                ['_primitives'],
                ['_compounds'],
                ['_aggregates'],
                ['_systems'],
                ['_ecosystems'],
              ],
            ],
            publicRootNodes: ['src/main.ts'],
            roles: [
              {
                allowMultipleSymbols: true,
                category: '_constants',
                isCategoryNode: true,
                name: 'constant',
              },
              {
                allowMultipleSymbols: true,
                category: '_types',
                isCategoryNode: true,
                name: 'type',
              },
              {
                allowMultipleSymbols: true,
                category: '_mocks',
                isCategoryNode: true,
                name: 'mock',
              },
              {
                allowMultipleSymbols: true,
                category: '_configs',
                name: 'config',
              },
              { category: '_schemas', name: 'schema' },
              { category: '_utils', name: 'util' },
              { category: '_norms', name: 'norm' },
              { category: '_adapters', name: 'adapter' },
              { category: '_services', name: 'service' },
              { category: '_stores', name: 'store' },
              { category: '_rules', name: 'rule' },
            ],
            rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
            subGraphRoles: [{ name: 'spec' }],
          },
        ],
      },
    };
    const result = validateConfigFormat(config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(config);
    }
  });

  it('preserves declaration meaning regardless of property order', () => {
    const config1 = {
      faf: {
        common: {
          roles: [{ category: '_utils', name: 'util' }],
          subGraphRoles: [{ name: 'spec' }],
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };
    const config2 = {
      faf: {
        common: {
          roles: [{ category: '_utils', name: 'util' }],
          subGraphRoles: [{ name: 'spec' }],
        },
        locals: [{ rootLayers: ['src'] }],
      },
    };

    const result1 = validateConfigFormat(config1);
    const result2 = validateConfigFormat(config2);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
  });

  it('accepts both rootLayers and rootFragments when second is empty', () => {
    const result = validateConfigFormat({
      faf: {
        locals: [{ rootFragments: [], rootLayers: ['src'] }],
      },
    });
    expect(result.ok).toBe(true);
  });

  it('accepts both rootLayers and rootFragments when first is empty', () => {
    const result = validateConfigFormat({
      faf: {
        locals: [
          { rootFragments: [{ path: 'src', rootNodes: [] }], rootLayers: [] },
        ],
      },
    });
    expect(result.ok).toBe(true);
  });

  const testCases: readonly {
    readonly constraint: TConfigConstraint;
    readonly description: string;
    readonly message: string;
    readonly normativeReference: string;
    readonly payload: unknown;
    readonly propertyPath: string;
  }[] = [
    {
      constraint: 'configuration/null-forbidden',
      description: 'null root object',
      message: 'Configuration value cannot be null.',
      normativeReference: 'D-14',
      payload: null,
      propertyPath: '',
    },
    {
      constraint: 'configuration/invalid-type',
      description: 'primitive root string',
      message: 'Configuration value must be a plain object.',
      normativeReference: 'D-14',
      payload: 'invalid',
      propertyPath: '',
    },
    {
      constraint: 'configuration/missing-property',
      description: 'missing faf property',
      message: 'Required property "faf" is missing.',
      normativeReference: 'D-14',
      payload: {},
      propertyPath: 'faf',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'root property trees',
      message:
        'Unknown property "trees" is forbidden on root configuration object.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [{ rootLayers: ['src'] }] }, trees: [] },
      propertyPath: 'trees',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'root property $schema',
      message:
        'Unknown property "$schema" is forbidden on root configuration object.',
      normativeReference: 'D-14',
      payload: {
        $schema: 'https://example.com',
        faf: { locals: [{ rootLayers: ['src'] }] },
      },
      propertyPath: '$schema',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'root property severity',
      message:
        'Unknown property "severity" is forbidden on root configuration object.',
      normativeReference: 'D-14',
      payload: {
        faf: { locals: [{ rootLayers: ['src'] }] },
        severity: 'error',
      },
      propertyPath: 'severity',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'root property warnings',
      message:
        'Unknown property "warnings" is forbidden on root configuration object.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [{ rootLayers: ['src'] }] }, warnings: [] },
      propertyPath: 'warnings',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'property layers in common',
      message: 'Unknown property "layers" is forbidden.',
      normativeReference: 'D-14',
      payload: {
        faf: { common: { layers: [] }, locals: [{ rootLayers: ['src'] }] },
      },
      propertyPath: 'faf.common.layers',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'property publicNodes in common',
      message: 'Unknown property "publicNodes" is forbidden.',
      normativeReference: 'D-14',
      payload: {
        faf: { common: { publicNodes: [] }, locals: [{ rootLayers: ['src'] }] },
      },
      propertyPath: 'faf.common.publicNodes',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'property namingContracts in locals',
      message: 'Unknown property "namingContracts" is forbidden.',
      normativeReference: 'D-14',
      payload: {
        faf: { locals: [{ namingContracts: [], rootLayers: ['src'] }] },
      },
      propertyPath: 'faf.locals[0].namingContracts',
    },
    {
      constraint: 'configuration/scope-mismatch',
      description: 'rootLayers in common',
      message:
        'Property "rootLayers" cannot be declared in common; root origins must be declared in locals.',
      normativeReference: 'D-14',
      payload: {
        faf: {
          common: { rootLayers: ['src'] },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      propertyPath: 'faf.common.rootLayers',
    },
    {
      constraint: 'configuration/scope-mismatch',
      description: 'rootFragments in common',
      message:
        'Property "rootFragments" cannot be declared in common; root origins must be declared in locals.',
      normativeReference: 'D-14',
      payload: {
        faf: {
          common: { rootFragments: [] },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      propertyPath: 'faf.common.rootFragments',
    },
    {
      constraint: 'configuration/scope-mismatch',
      description: 'aliases in locals',
      message:
        'Property "aliases" cannot be declared in locals; it must be declared exclusively in common.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [{ aliases: {}, rootLayers: ['src'] }] } },
      propertyPath: 'faf.locals[0].aliases',
    },
    {
      constraint: 'configuration/missing-property',
      description: 'missing locals in faf',
      message: 'Required property "locals" is missing.',
      normativeReference: 'D-14',
      payload: { faf: {} },
      propertyPath: 'faf.locals',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null locals',
      message: 'Property "locals" cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: { locals: null } },
      propertyPath: 'faf.locals',
    },
    {
      constraint: 'configuration/invalid-type',
      description: 'non-array locals',
      message: 'Property "locals" must be an array.',
      normativeReference: 'D-14',
      payload: { faf: { locals: {} } },
      propertyPath: 'faf.locals',
    },
    {
      constraint: 'configuration/empty-list',
      description: 'empty locals',
      message:
        'Property "locals" must contain at least one local configuration.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [] } },
      propertyPath: 'faf.locals',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null element in locals',
      message: 'Local configuration element cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [null] } },
      propertyPath: 'faf.locals[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      description: 'non-object element in locals',
      message: 'Local configuration element must be an object.',
      normativeReference: 'D-14',
      payload: { faf: { locals: ['invalid'] } },
      propertyPath: 'faf.locals[0]',
    },
    {
      constraint: 'configuration/missing-origin',
      description: 'local configuration without any origin',
      message:
        'Local configuration must declare at least one origin via "rootLayers" or "rootFragments".',
      normativeReference: 'D-06',
      payload: { faf: { locals: [{ roles: [] }] } },
      propertyPath: 'faf.locals[0]',
    },
    {
      constraint: 'configuration/missing-origin',
      description: 'local configuration with both origins empty',
      message:
        'Both "rootLayers" and "rootFragments" are empty; at least one non-empty origin must be provided.',
      normativeReference: 'D-06',
      payload: { faf: { locals: [{ rootFragments: [], rootLayers: [] }] } },
      propertyPath: 'faf.locals[0]',
    },
    {
      constraint: 'configuration/empty-list',
      description: 'sole origin rootLayers is empty',
      message:
        'Origin list "rootLayers" cannot be empty when it is the sole origin.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [{ rootLayers: [] }] } },
      propertyPath: 'faf.locals[0].rootLayers',
    },
    {
      constraint: 'configuration/empty-list',
      description: 'sole origin rootFragments is empty',
      message:
        'Origin list "rootFragments" cannot be empty when it is the sole origin.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [{ rootFragments: [] }] } },
      propertyPath: 'faf.locals[0].rootFragments',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null roles in local config',
      message: 'Property "roles" cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: { locals: [{ roles: null, rootLayers: ['src'] }] } },
      propertyPath: 'faf.locals[0].roles',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null common',
      message: 'Property "common" cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: { common: null, locals: [{ rootLayers: ['src'] }] } },
      propertyPath: 'faf.common',
    },
    {
      constraint: 'configuration/invalid-type',
      description: 'non-object common',
      message: 'Property "common" must be an object.',
      normativeReference: 'D-14',
      payload: {
        faf: { common: 'invalid', locals: [{ rootLayers: ['src'] }] },
      },
      propertyPath: 'faf.common',
    },
    {
      constraint: 'configuration/invalid-foreign-pattern',
      description: 'invalid foreign pattern in common',
      message: 'Invalid foreign pattern "!*.md": negation.',
      normativeReference: 'D-05',
      payload: {
        faf: {
          common: { foreignNodes: [{ paths: ['src'], patterns: ['!*.md'] }] },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      propertyPath: 'faf.common.foreignNodes[0].patterns[0]',
    },
    {
      constraint: 'configuration/empty-tier',
      description: 'empty tier in common horizontalHierarchies',
      message: 'Hierarchy tier cannot be empty.',
      normativeReference: 'FAF §6.2.2',
      payload: {
        faf: {
          common: { horizontalHierarchies: [[[]]] },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      propertyPath: 'faf.common.horizontalHierarchies[0][0]',
    },
    {
      constraint: 'configuration/missing-property',
      description: 'missing from in common treeDependencies',
      message: 'Required property "from" is missing.',
      normativeReference: 'D-14',
      payload: {
        faf: {
          common: { treeDependencies: [{ to: ['lib'] }] },
          locals: [{ rootLayers: ['src'] }],
        },
      },
      propertyPath: 'faf.common.treeDependencies[0].from',
    },
    {
      constraint: 'configuration/invalid-foreign-pattern',
      description: 'invalid foreign pattern in local',
      message: 'Invalid foreign pattern "!*.md": negation.',
      normativeReference: 'D-05',
      payload: {
        faf: {
          locals: [
            {
              foreignNodes: [{ paths: ['src'], patterns: ['!*.md'] }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      propertyPath: 'faf.locals[0].foreignNodes[0].patterns[0]',
    },
    {
      constraint: 'configuration/empty-tier',
      description: 'empty tier in local horizontalHierarchies',
      message: 'Hierarchy tier cannot be empty.',
      normativeReference: 'FAF §6.2.2',
      payload: {
        faf: {
          locals: [
            {
              horizontalHierarchies: [[[]]],
              rootLayers: ['src'],
            },
          ],
        },
      },
      propertyPath: 'faf.locals[0].horizontalHierarchies[0][0]',
    },
    {
      constraint: 'configuration/empty-list',
      description: 'empty actions in local mimeticPathStructures',
      message: 'Property "actions" cannot be empty when present.',
      normativeReference: 'D-14',
      payload: {
        faf: {
          locals: [
            {
              mimeticPathStructures: [{ actions: [], paths: ['src/_apis'] }],
              rootLayers: ['src'],
            },
          ],
        },
      },
      propertyPath: 'faf.locals[0].mimeticPathStructures[0].actions',
    },
    {
      constraint: 'configuration/missing-property',
      description: 'missing to in local treeDependencies',
      message: 'Required property "to" is missing.',
      normativeReference: 'D-14',
      payload: {
        faf: {
          locals: [
            {
              rootLayers: ['src'],
              treeDependencies: [{ from: ['src'] }],
            },
          ],
        },
      },
      propertyPath: 'faf.locals[0].treeDependencies[0].to',
    },
    {
      constraint: 'configuration/invalid-file-name',
      description: 'slash in root node in local rootFragments',
      message:
        'Root node file name "app/app.tsx" must be a direct child without "/".',
      normativeReference: 'D-05',
      payload: {
        faf: {
          locals: [
            {
              rootFragments: [{ path: 'src', rootNodes: [['app/app.tsx']] }],
            },
          ],
        },
      },
      propertyPath: 'faf.locals[0].rootFragments[0].rootNodes[0][0]',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      description: 'invalid literal path in local rootLayers',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'D-05',
      payload: {
        faf: {
          locals: [{ rootLayers: ['./src'] }],
        },
      },
      propertyPath: 'faf.locals[0].rootLayers[0]',
    },
    {
      constraint: 'configuration/duplicate-role-name',
      description: 'duplicate role names in local roles',
      message: 'Duplicate role name "util".',
      normativeReference: 'FAF §6.3.1',
      payload: {
        faf: {
          locals: [
            {
              roles: [
                { category: '_utils', name: 'util' },
                { category: '_helpers', name: 'util' },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      },
      propertyPath: 'faf.locals[0].roles[1].name',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null faf property',
      message: 'Property "faf" cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: null },
      propertyPath: 'faf',
    },
    {
      constraint: 'configuration/invalid-type',
      description: 'non-object faf property',
      message: 'Property "faf" must be an object.',
      normativeReference: 'D-14',
      payload: { faf: 123 },
      propertyPath: 'faf',
    },
    {
      constraint: 'configuration/unknown-property',
      description: 'unknown property on faf object',
      message: 'Unknown property "severity" is forbidden on faf object.',
      normativeReference: 'D-14',
      payload: {
        faf: { locals: [{ rootLayers: ['src'] }], severity: 'error' },
      },
      propertyPath: 'faf.severity',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null property on faf object',
      message: 'Property "common" cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: { common: null, locals: [{ rootLayers: ['src'] }] } },
      propertyPath: 'faf.common',
    },
    {
      constraint: 'configuration/null-forbidden',
      description: 'null property on root object',
      message: 'Property "faf" cannot be null.',
      normativeReference: 'D-14',
      payload: { faf: null },
      propertyPath: 'faf',
    },
  ];

  it.each(testCases)(
    'rejects invalid configuration: $description',
    ({ constraint, payload, propertyPath }) => {
      const result = validateConfigFormat(payload);
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      const outcome = result.outcomes.find(
        (o) =>
          o.family === 'configuration' &&
          o.constraint === constraint &&
          o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(
        OUTCOME_CATALOG[constraint].normativeReference
      );
      expect(outcome?.message).toContain(propertyPath);
    }
  );

  it('rejects explicit undefined on optional properties', () => {
    const fafInner: Record<string, unknown> = {
      locals: [{ rootLayers: ['src'] }],
    };
    Object.defineProperty(fafInner, 'common', {
      enumerable: true,
      value: void 0,
    });
    const raw: Record<string, unknown> = {
      faf: fafInner,
    };
    const result = validateConfigFormat(raw);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.constraint === 'configuration/explicit-undefined' &&
          o.propertyPath === 'faf.common'
      )
    ).toBe(true);
    const outcome = result.outcomes.find(
      (o) =>
        o.family === 'configuration' &&
        o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    if (outcome?.family !== 'configuration') {
      return;
    }
    expect(outcome.normativeReference).toBe('D-14');
    expect(outcome.propertyPath).toBe('faf.common');
    expect(outcome.element).toBe('faf.common');
    expect(outcome.message).toBe("'faf.common' cannot be explicitly undefined");
  });

  it('rejects explicit undefined on root properties', () => {
    const raw: Record<string, unknown> = {};
    Object.defineProperty(raw, 'faf', {
      enumerable: true,
      value: void 0,
    });
    const result = validateConfigFormat(raw);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.constraint === 'configuration/explicit-undefined' &&
          o.propertyPath === 'faf'
      )
    ).toBe(true);
    const outcome = result.outcomes.find(
      (o) =>
        o.family === 'configuration' &&
        o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    if (outcome?.family !== 'configuration') {
      return;
    }
    expect(outcome.normativeReference).toBe('D-14');
    expect(outcome.propertyPath).toBe('faf');
    expect(outcome.element).toBe('faf');
    expect(outcome.message).toBe("'faf' cannot be explicitly undefined");
  });

  it('rejects explicit undefined field in local config', () => {
    const localRecord: Record<string, unknown> = { rootLayers: ['src'] };
    Object.defineProperty(localRecord, 'roles', {
      enumerable: true,
      value: void 0,
    });
    const result = validateConfigFormat({ faf: { locals: [localRecord] } });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.constraint === 'configuration/explicit-undefined' &&
          o.propertyPath === 'faf.locals[0].roles'
      )
    ).toBe(true);
    const outcome = result.outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.message).toBe(
      "'faf.locals[0].roles' cannot be explicitly undefined"
    );
  });

  it('rejects explicit undefined field in common config', () => {
    const commonRecord: Record<string, unknown> = {};
    Object.defineProperty(commonRecord, 'roles', {
      enumerable: true,
      value: void 0,
    });
    const result = validateConfigFormat({
      faf: { common: commonRecord, locals: [{ rootLayers: ['src'] }] },
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.constraint === 'configuration/explicit-undefined' &&
          o.propertyPath === 'faf.common.roles'
      )
    ).toBe(true);
    const outcome = result.outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.message).toBe(
      "'faf.common.roles' cannot be explicitly undefined"
    );
  });

  it('collects multiple outcomes across different properties and levels', () => {
    const flawedConfig = {
      extraRoot: true,
      faf: {
        common: {
          rootLayers: ['src'],
          unknownInCommon: true,
        },
        extraFaf: true,
        locals: [
          {
            aliases: {},
            extraLocal: true,
            rootLayers: ['invalid/./path', 'invalid/./path'],
          },
        ],
      },
    };

    const result = validateConfigFormat(flawedConfig);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.outcomes.length).toBeGreaterThanOrEqual(6);
    expect(
      result.outcomes.some(
        (o) => o.family === 'configuration' && o.propertyPath === 'extraRoot'
      )
    ).toBe(true);
    expect(
      result.outcomes.some(
        (o) => o.family === 'configuration' && o.propertyPath === 'faf.extraFaf'
      )
    ).toBe(true);
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.propertyPath === 'faf.common.rootLayers'
      )
    ).toBe(true);
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.propertyPath === 'faf.common.unknownInCommon'
      )
    ).toBe(true);
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.propertyPath === 'faf.locals[0].aliases'
      )
    ).toBe(true);
    expect(
      result.outcomes.some(
        (o) =>
          o.family === 'configuration' &&
          o.propertyPath === 'faf.locals[0].extraLocal'
      )
    ).toBe(true);
    for (const outcome of result.outcomes) {
      expect(outcome.family).toBe('configuration');
      if (outcome.family !== 'configuration') {
        continue;
      }

      expect(outcome.element).toBe(outcome.propertyPath);
      expect(outcome.constraint.startsWith('configuration/')).toBe(true);
      expect(
        outcome.normativeReference.startsWith('FAF §') ||
          outcome.normativeReference.startsWith('D-')
      ).toBe(true);
    }
  });
});

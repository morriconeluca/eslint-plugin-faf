import type { CompletionEntry } from 'typescript';

import fs from 'node:fs';
import path from 'node:path';
import {
  createSourceFile,
  isInterfaceDeclaration,
  ScriptTarget,
} from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../src/main.js';

import {
  compileInBothModes,
  compilerLoose,
  compilerStrict,
  CONFIG_TYPES_IMPORT,
  WARMUP_TIMEOUT_MS,
  warmupTypeHarness,
} from './type-harness.js';

const getEntryNames = (
  entries: readonly CompletionEntry[]
): readonly string[] => entries.map((entry) => entry.name);

const NEGATIVE_LITERAL_CASES = [
  {
    description: 'rejects empty locals array in TFAFConfig',
    snippet: '({ faf: { locals: [] } }) satisfies TFAFConfig;',
  },
  {
    description: 'rejects empty local origins in TFAFLocalConfig',
    snippet:
      '({ rootLayers: [], rootFragments: [] }) satisfies TFAFLocalConfig;',
  },
  {
    description: 'rejects rootLayers declared inside TFAFCommonConfig',
    snippet: "({ rootLayers: ['src'] }) satisfies TFAFCommonConfig;",
  },
  {
    description: 'rejects aliases declared inside TFAFLocalConfig',
    snippet:
      "({ rootLayers: ['src'], aliases: {} }) satisfies TFAFLocalConfig;",
  },
  {
    description:
      'rejects TFAFRole with implicit extensions when isCategoryNode is false',
    snippet:
      "({ name: 'image', category: '_images', implicitRoleExtensions: ['.png'], isCategoryNode: false }) satisfies TFAFRole;",
  },
  {
    description: 'rejects allowMultipleSymbols configured on TFAFSubGraphRole',
    snippet:
      "({ name: 'spec', allowMultipleSymbols: true }) satisfies TFAFSubGraphRole;",
  },
  {
    description: 'rejects empty tier inside TFAFHierarchy',
    snippet: '[[]] satisfies TFAFHierarchy;',
  },
  {
    description: 'rejects empty from array inside TFAFExternalDependency',
    snippet:
      "({ from: [], to: ['legacy/client.ts'] }) satisfies TFAFExternalDependency;",
  },
  {
    description: 'rejects removed property publicNodes in TFAFCommonConfig',
    snippet: '({ publicNodes: [] }) satisfies TFAFCommonConfig;',
  },
  {
    description: 'rejects removed property namingContracts in TFAFCommonConfig',
    snippet: '({ namingContracts: [] }) satisfies TFAFCommonConfig;',
  },
] as const;

const POSITIVE_AUXILIARY_CASES = [
  {
    description: 'accepts non-empty string array for TFAFNonEmptyArray',
    snippet: "['src'] as const satisfies TFAFNonEmptyArray<string>;",
  },
  {
    description: 'accepts empty hierarchy array for TFAFHierarchy',
    snippet: '[] as const satisfies TFAFHierarchy;',
  },
  {
    description: 'accepts empty roles catalog for TFAFRoles',
    snippet: '[] as const satisfies TFAFRoles;',
  },
  {
    description: 'accepts nested hierarchy tiers list',
    snippet:
      "[[], [['a'], ['b', 'c']]] as const satisfies readonly TFAFHierarchy[];",
  },
  {
    description: 'accepts TFAFRootFragment with nested subRootFragments',
    snippet:
      "({ path: 'src', rootNodes: [], subRootFragments: [{ path: 'src/app', rootNodes: [['AppEntry.tsx']] }] }) as const satisfies TFAFRootFragment;",
  },
  {
    description: 'accepts TFAFRootDependencyEdge with valid from and to arrays',
    snippet:
      "({ from: ['main.tsx'], to: ['src/app/AppEntry.tsx'] }) as const satisfies TFAFRootDependencyEdge;",
  },
  {
    description: 'accepts TFAFForeignNodeFamily with valid paths and patterns',
    snippet:
      "({ paths: ['src'], patterns: ['*.md'] }) as const satisfies TFAFForeignNodeFamily;",
  },
  {
    description:
      'accepts TFAFLocalHorizontalHierarchy with valid paths and hierarchy',
    snippet:
      "({ paths: ['src'], hierarchies: [] }) as const satisfies TFAFLocalHorizontalHierarchy;",
  },
  {
    description: 'accepts TFAFMimeticPathStructure with parent category paths',
    snippet:
      "({ paths: ['src/_apis'] }) as const satisfies TFAFMimeticPathStructure;",
  },
  {
    description: 'accepts TFAFTreeDependency with source and target origins',
    snippet:
      "({ from: ['src'], to: ['lib'] }) as const satisfies TFAFTreeDependency;",
  },
  {
    description:
      'accepts TFAFExternalDependency with source node and target external files',
    snippet:
      "({ from: ['src/main.tsx'], to: ['legacy/client.ts'] }) as const satisfies TFAFExternalDependency;",
  },
  {
    description:
      'accepts TFAFSharedConfig with roles and mixed foreignNodes definitions',
    snippet:
      "({ roles: [], foreignNodes: ['src/README.md', { paths: ['src'], patterns: ['*.md'] }] }) as const satisfies TFAFSharedConfig;",
  },
  {
    description: 'accepts TFAFCommonConfig with direct aliases map',
    snippet:
      "({ aliases: { '#shared': 'src/_src@shared' } }) as const satisfies TFAFCommonConfig;",
  },
  {
    description:
      'accepts TFAFLocalConfig with rootLayers and empty rootFragments',
    snippet:
      "({ rootLayers: ['lib'], rootFragments: [] }) as const satisfies TFAFLocalConfig;",
  },
  {
    description:
      'accepts TFAFLocalConfig with empty rootLayers and populated rootFragments',
    snippet:
      "({ rootLayers: [], rootFragments: [{ path: 'src', rootNodes: [] }] }) as const satisfies TFAFLocalConfig;",
  },
  {
    description:
      'accepts TFAFLocalConfig with both rootLayers and rootFragments populated',
    snippet:
      "({ rootLayers: ['lib'], rootFragments: [{ path: 'src', rootNodes: [] }] }) as const satisfies TFAFLocalConfig;",
  },
] as const;

const NEGATIVE_AUXILIARY_CASES = [
  {
    description: 'rejects empty array for TFAFNonEmptyArray',
    snippet: '[] satisfies TFAFNonEmptyArray<string>;',
  },
  {
    description: 'rejects empty group of roles inside TFAFRoles',
    snippet: '[[]] satisfies TFAFRoles;',
  },
  {
    description: 'rejects TFAFRootFragment missing rootNodes property',
    snippet: "({ path: 'src' }) satisfies TFAFRootFragment;",
  },
  {
    description: 'rejects subRootFragments children missing rootNodes property',
    snippet:
      "({ path: 'src', rootNodes: [], subRootFragments: [{ path: 'src/app' }] }) satisfies TFAFRootFragment;",
  },
  {
    description: 'rejects empty to array in TFAFRootDependencyEdge',
    snippet:
      "({ from: ['main.tsx'], to: [] }) satisfies TFAFRootDependencyEdge;",
  },
  {
    description: 'rejects empty patterns array in TFAFForeignNodeFamily',
    snippet:
      "({ paths: ['src'], patterns: [] }) satisfies TFAFForeignNodeFamily;",
  },
  {
    description: 'rejects empty paths array in TFAFLocalHorizontalHierarchy',
    snippet:
      '({ paths: [], hierarchies: [] }) satisfies TFAFLocalHorizontalHierarchy;',
  },
  {
    description:
      'rejects nested hierarchy list in TFAFLocalHorizontalHierarchy hierarchies',
    snippet:
      "({ paths: ['src'], hierarchies: [[['_types']]] }) satisfies TFAFLocalHorizontalHierarchy;",
  },
  {
    description: 'rejects empty actions array in TFAFMimeticPathStructure',
    snippet:
      "({ paths: ['src/_apis'], actions: [] }) satisfies TFAFMimeticPathStructure;",
  },
  {
    description: 'rejects empty from array in TFAFTreeDependency',
    snippet: "({ from: [], to: ['lib'] }) satisfies TFAFTreeDependency;",
  },
  {
    description: 'rejects empty to array in TFAFExternalDependency',
    snippet:
      "({ from: ['src/main.tsx'], to: [] }) satisfies TFAFExternalDependency;",
  },
  {
    description: 'rejects array fallback in TFAFCommonConfig aliases mapping',
    snippet:
      "({ aliases: { '#shared': ['src/_src@shared'] } }) satisfies TFAFCommonConfig;",
  },
] as const;

const STATIC_RUNTIME_LIMIT_CASES = [
  {
    description: 'compiles statically with a non-existent path on disk',
    snippet:
      "({ faf: { locals: [{ rootLayers: ['non/existent/path/on/disk'] }] } }) satisfies TFAFConfig;",
  },
  {
    description:
      'compiles statically when externalDependencies points to a directory',
    snippet:
      "({ from: ['src/_src@shared'], to: ['legacy'] }) satisfies TFAFExternalDependency;",
  },
  {
    description:
      'compiles statically when roles is absent from both common and locals',
    snippet:
      "({ faf: { locals: [{ rootLayers: ['src'] }] } }) satisfies TFAFConfig;",
  },
  {
    description:
      'compiles statically with an empty string in a name or path property',
    snippet: "({ category: '', name: '' }) satisfies TFAFRole;",
  },
  {
    description:
      'compiles statically when the same role name appears in multiple tiers',
    snippet:
      "[[{ category: '_utils', name: 'util' }], [{ category: '_utils', name: 'util' }]] satisfies TFAFRoles;",
  },
  {
    description:
      'compiles statically with relative paths containing parent segments',
    snippet:
      "({ faf: { locals: [{ rootLayers: ['src/../src'] }] } }) satisfies TFAFConfig;",
  },
] as const;

describe('static type contracts of public configuration', () => {
  beforeAll(() => {
    warmupTypeHarness();
  }, WARMUP_TIMEOUT_MS);

  describe('readonly configuration composition and completions', () => {
    it('accepts readonly composition using as const satisfies in both modes', () => {
      const snippet = `
        import type { TFAFConfig, TFAFRole } from './src/main.js';
        const role = {
          category: '_images',
          implicitRoleExtensions: ['.png'],
          name: 'image',
        } as const satisfies TFAFRole;
        export default {
          faf: {
            common: { roles: [role], subGraphRoles: [{ name: 'spec' }] },
            locals: [{ rootLayers: ['src'] }],
          },
        } as const satisfies TFAFConfig;
      `;
      const result = compileInBothModes(snippet);
      expect(result.strictErrors).toHaveLength(0);
      expect(result.looseErrors).toHaveLength(0);
    });

    it('provides completions and JSDoc for common and locals within faf', () => {
      const code = `
        import type { TFAFConfig } from './src/main.js';
        const configuration: TFAFConfig = {
          faf: {
            
          },
        };
      `;
      const marker = 'faf: {\n            ';
      const completions = compilerStrict.getCompletions(code, marker);
      const names = getEntryNames(completions);
      expect(names).toContain('common');
      expect(names).toContain('locals');

      const commonDetails = compilerStrict.getCompletionDetails(
        code,
        marker,
        'common'
      );
      expect(commonDetails?.documentation).toBeDefined();
      expect(
        commonDetails?.documentation?.map((d) => d.text).join('')
      ).toContain('Shared declarations');

      const localsDetails = compilerStrict.getCompletionDetails(
        code,
        marker,
        'locals'
      );
      expect(localsDetails?.documentation).toBeDefined();
      expect(
        localsDetails?.documentation?.map((d) => d.text).join('')
      ).toContain('Architectural configurations');
    });

    it('provides completions and JSDoc for roles and authorizations within common', () => {
      const code = `
        import type { TFAFConfig } from './src/main.js';
        const configuration: TFAFConfig = {
          faf: {
            common: {
              
            },
            locals: [{ rootLayers: ['src'] }],
          },
        };
      `;
      const marker = 'common: {\n              ';
      const completions = compilerStrict.getCompletions(code, marker);
      const names = getEntryNames(completions);
      expect(names).toContain('roles');
      expect(names).toContain('subGraphRoles');
      expect(names).toContain('aliases');
      expect(names).toContain('treeDependencies');
      expect(names).toContain('externalDependencies');

      const rolesDetails = compilerStrict.getCompletionDetails(
        code,
        marker,
        'roles'
      );
      expect(rolesDetails?.documentation).toBeDefined();
    });

    it('provides completions and JSDoc for rootFragments and authorizations within locals', () => {
      const code = `
        import type { TFAFConfig } from './src/main.js';
        const configuration: TFAFConfig = {
          faf: {
            locals: [
              {
                
              },
            ],
          },
        };
      `;
      const marker = 'locals: [\n              {\n                ';
      const completions = compilerStrict.getCompletions(code, marker);
      const names = getEntryNames(completions);
      expect(names).toContain('rootLayers');
      expect(names).toContain('rootFragments');
      expect(names).toContain('treeDependencies');
      expect(names).toContain('externalDependencies');
    });

    it('provides completions and JSDoc for role properties within roles definition', () => {
      const code = `
        import type { TFAFRole } from './src/main.js';
        const role: TFAFRole = {
          name: 'test',
          category: '_tests',
          
        };
      `;
      const marker = "category: '_tests',\n          ";
      const completions = compilerStrict.getCompletions(code, marker);
      const names = getEntryNames(completions);
      expect(names).toContain('allowMultipleSymbols');
      expect(names).toContain('isCategoryNode');
      expect(names).toContain('implicitRoleExtensions');
    });

    it('provides completions and JSDoc for rootFragments properties', () => {
      const code = `
        import type { TFAFRootFragment } from './src/main.js';
        const fragment: TFAFRootFragment = {
          path: 'src',
          rootNodes: [],
          
        };
      `;
      const marker = 'rootNodes: [],\n          ';
      const completions = compilerStrict.getCompletions(code, marker);
      const names = getEntryNames(completions);
      expect(names).toContain('subRootFragments');
      expect(names).toContain('dependencyEdges');
    });

    it('provides completions and JSDoc for directed authorizations properties', () => {
      const code = `
        import type { TFAFTreeDependency } from './src/main.js';
        const dependency: TFAFTreeDependency = {
          
        };
      `;
      const marker = 'dependency: TFAFTreeDependency = {\n          ';
      const completions = compilerStrict.getCompletions(code, marker);
      const names = getEntryNames(completions);
      expect(names).toContain('from');
      expect(names).toContain('to');
    });

    it('does not propose removed publicNodes or namingContracts in completions', () => {
      const code = `
        import type { TFAFConfig } from './src/main.js';
        const configuration: TFAFConfig = {
          faf: {
            common: {
              
            },
            locals: [
              {
                
              },
            ],
          },
        };
      `;
      const commonMarker = 'common: {\n              ';
      const commonCompletions = getEntryNames(
        compilerStrict.getCompletions(code, commonMarker)
      );
      expect(commonCompletions).not.toContain('publicNodes');
      expect(commonCompletions).not.toContain('namingContracts');

      const localMarker = 'locals: [\n              {\n                ';
      const localCompletions = getEntryNames(
        compilerStrict.getCompletions(code, localMarker)
      );
      expect(localCompletions).not.toContain('publicNodes');
      expect(localCompletions).not.toContain('namingContracts');
    });

    it('exports type aliases with T prefix and no interfaces', () => {
      const mainPath = path.resolve(process.cwd(), 'src/main.ts');
      const source = fs.readFileSync(mainPath, 'utf8');
      const sourceFile = createSourceFile(
        'main.ts',
        source,
        ScriptTarget.ES2022,
        true
      );
      const interfaces = sourceFile.statements.filter((statement) =>
        isInterfaceDeclaration(statement)
      );
      expect(interfaces).toHaveLength(0);
    });

    it('does not freeze configuration object at runtime when using satisfies TFAFConfig', () => {
      const config = {
        faf: {
          locals: [
            {
              rootLayers: ['src'],
            },
          ],
        },
      } as const satisfies TFAFConfig;
      expect(Object.isFrozen(config)).toBe(false);
      expect(Object.isFrozen(config.faf)).toBe(false);
      expect(Object.isFrozen(config.faf.locals)).toBe(false);
    });
  });

  describe('static detection of impossible literal shapes', () => {
    it.each(NEGATIVE_LITERAL_CASES)(
      '$description in both modes',
      ({ snippet }) => {
        const result = compileInBothModes(snippet);
        expect(result.strictErrors.length).toBeGreaterThan(0);
        expect(result.looseErrors.length).toBeGreaterThan(0);
      }
    );
  });

  describe('preservation of recursion, cardinality, and declaration shapes in auxiliary types', () => {
    it.each(POSITIVE_AUXILIARY_CASES)(
      '$description in both modes',
      ({ snippet }) => {
        const result = compileInBothModes(snippet);
        expect(result.strictErrors).toHaveLength(0);
        expect(result.looseErrors).toHaveLength(0);
      }
    );

    it.each(NEGATIVE_AUXILIARY_CASES)(
      '$description in both modes',
      ({ snippet }) => {
        const result = compileInBothModes(snippet);
        expect(result.strictErrors.length).toBeGreaterThan(0);
        expect(result.looseErrors.length).toBeGreaterThan(0);
      }
    );
  });

  describe('static limits demonstrating necessity of runtime validation', () => {
    it.each(STATIC_RUNTIME_LIMIT_CASES)(
      '$description in both modes',
      ({ snippet }) => {
        const result = compileInBothModes(snippet);
        expect(result.strictErrors).toHaveLength(0);
        expect(result.looseErrors).toHaveLength(0);
      }
    );

    it('compiles statically with unknown properties through non-literal assignments', () => {
      const snippet = `
        const extraProperties = {
          rootLayers: ['src'] as const,
          unrecognizedProperty: 42,
        };
        export default {
          faf: {
            locals: [extraProperties],
          },
        } satisfies TFAFConfig;
      `;
      const result = compileInBothModes(snippet);
      expect(result.strictErrors).toHaveLength(0);
      expect(result.looseErrors).toHaveLength(0);
    });

    it('compiles explicit undefined in optional property only when exactOptionalPropertyTypes is false', () => {
      const snippet =
        "({ faf: { common: { roles: undefined }, locals: [{ rootLayers: ['src'] }] } }) satisfies TFAFConfig;";
      const strictResult = compilerStrict.compile(
        `${CONFIG_TYPES_IMPORT}\n${snippet}`
      );
      const looseResult = compilerLoose.compile(
        `${CONFIG_TYPES_IMPORT}\n${snippet}`
      );
      expect(strictResult.errors.length).toBeGreaterThan(0);
      expect(looseResult.errors).toHaveLength(0);
    });
  });
});

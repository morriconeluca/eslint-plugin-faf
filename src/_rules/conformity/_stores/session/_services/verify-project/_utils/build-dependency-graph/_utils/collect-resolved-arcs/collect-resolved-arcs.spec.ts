import { describe, expect, it } from 'vitest';

import type {
  TModuleImport,
  TModuleRecord,
} from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { collectResolvedArcs } from './collect-resolved-arcs.util.js';

const SOURCE = 'src/app.ts';
const DESTINATION = 'src/widget.util.ts';
const SPECIFIER = './widget.util.js';

const moduleImport = (
  overrides: Partial<TModuleImport> = {}
): TModuleImport => ({
  isTypeOnly: false,
  kind: 'named-import',
  position: { column: 1, line: 1 },
  specifier: SPECIFIER,
  ...overrides,
});

const recordWith = (imports: readonly TModuleImport[]): TModuleRecord => ({
  exports: [],
  imports,
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
});

const resolution = (
  target: TImportResolution['target'],
  importIndex = 0
): TImportResolution => ({
  aliasAlternatives: ['src', 'other'],
  aliasUsed: '#src',
  importIndex,
  sourcePath: SOURCE,
  target,
});

describe('collectResolvedArcs', () => {
  it('keeps distinct local edges and copies specifier, syntax, alias, and type-only flag', () => {
    const records = new Map<string, TModuleRecord>([
      [
        SOURCE,
        recordWith([
          moduleImport({
            isTypeOnly: true,
            kind: 'named-import',
            position: { column: 3, line: 4 },
          }),
          moduleImport({
            kind: 'export-named-from',
            position: { column: 1, line: 8 },
            specifier: './widget.util.js',
          }),
        ]),
      ],
    ]);
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [
        SOURCE,
        [
          resolution({ path: DESTINATION, type: 'local-file' }, 0),
          resolution({ path: DESTINATION, type: 'local-file' }, 1),
        ],
      ],
    ]);

    const arcs = collectResolvedArcs(
      records,
      resolutions,
      [SOURCE, DESTINATION],
      new Map([
        [DESTINATION, 1],
        [SOURCE, 0],
      ])
    );

    expect(arcs.libraryNotes).toEqual([]);
    expect(arcs.edges).toEqual([
      {
        destinationVertex: 1,
        metadata: {
          aliasAlternatives: ['src', 'other'],
          aliasUsed: '#src',
          destinationPath: DESTINATION,
          importIndex: 0,
          isTypeOnly: true,
          position: { column: 3, line: 4 },
          sourcePath: SOURCE,
          specifier: SPECIFIER,
          syntaxKind: 'named-import',
        },
        sourceVertex: 0,
      },
      {
        destinationVertex: 1,
        metadata: {
          aliasAlternatives: ['src', 'other'],
          aliasUsed: '#src',
          destinationPath: DESTINATION,
          importIndex: 1,
          isTypeOnly: false,
          position: { column: 1, line: 8 },
          sourcePath: SOURCE,
          specifier: SPECIFIER,
          syntaxKind: 'export-named-from',
        },
        sourceVertex: 0,
      },
    ]);
  });

  it('notes an external library without creating a local edge', () => {
    const records = new Map<string, TModuleRecord>([
      [
        SOURCE,
        recordWith([
          moduleImport({
            kind: 'side-effect-import',
            specifier: 'react',
          }),
        ]),
      ],
    ]);
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [
        SOURCE,
        [resolution({ packageName: 'react', type: 'external-library' }, 0)],
      ],
    ]);

    const arcs = collectResolvedArcs(
      records,
      resolutions,
      [SOURCE],
      new Map([[SOURCE, 0]])
    );

    expect(arcs.edges).toEqual([]);
    expect(arcs.libraryNotes).toEqual([
      {
        aliasAlternatives: ['src', 'other'],
        aliasUsed: '#src',
        importIndex: 0,
        isTypeOnly: false,
        packageName: 'react',
        position: { column: 1, line: 1 },
        sourcePath: SOURCE,
        specifier: 'react',
        syntaxKind: 'side-effect-import',
      },
    ]);
  });

  it('drops unresolved imports, null specifiers, missing resolutions, and unknown destinations', () => {
    const records = new Map<string, TModuleRecord>([
      [
        SOURCE,
        recordWith([
          moduleImport({ specifier: null }),
          moduleImport({ specifier: './missing.js' }),
          moduleImport({ specifier: './gone.js' }),
          moduleImport({ specifier: './orphan.js' }),
        ]),
      ],
    ]);
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [
        SOURCE,
        [
          resolution({ path: DESTINATION, type: 'local-file' }, 0),
          resolution({ reason: 'missing', type: 'unresolved' }, 1),
          resolution({ path: 'not-a-vertex.ts', type: 'local-file' }, 3),
        ],
      ],
    ]);

    const arcs = collectResolvedArcs(
      records,
      resolutions,
      [SOURCE, DESTINATION],
      new Map([
        [DESTINATION, 1],
        [SOURCE, 0],
      ])
    );

    expect(arcs.edges).toEqual([]);
    expect(arcs.libraryNotes).toEqual([]);
  });

  it('emits no arcs when the source has imports but no resolution list', () => {
    const imports = [moduleImport()];
    const arcs = collectResolvedArcs(
      new Map([[SOURCE, recordWith(imports)]]),
      new Map(),
      [SOURCE],
      new Map([[SOURCE, 0]])
    );

    expect(arcs.edges).toEqual([]);
    expect(arcs.libraryNotes).toEqual([]);
  });

  it('emits no arcs for a vertex that has no module record', () => {
    const arcs = collectResolvedArcs(
      new Map(),
      new Map<string, readonly TImportResolution[]>([
        [SOURCE, [resolution({ path: DESTINATION, type: 'local-file' })]],
      ]),
      [DESTINATION],
      new Map([[DESTINATION, 0]])
    );

    expect(arcs.edges).toEqual([]);
    expect(arcs.libraryNotes).toEqual([]);
  });
});

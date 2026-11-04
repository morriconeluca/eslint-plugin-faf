import { createFixture } from 'fs-fixture';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TEdgeLawDeclaration } from './edge-law-declaration.js';
import type { TEdgeLawName, TEdgeViolation } from './evaluate-edge-laws.js';

import fafConfig from '../../fafconfig.js';
import { declarationFromFafConfig } from './edge-law-declaration.js';
import {
  evaluateEdgeLaws,
  formatEdgeViolations,
} from './evaluate-edge-laws.js';
import { collectRelativeImports } from './relative-import-edges.js';

const FIXTURE_TSCONFIG = JSON.stringify({
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    resolveJsonModule: true,
    target: 'es2022',
  },
});

const repositoryRoot = path.resolve(import.meta.dirname, '../..');

const categoryHierarchyDeclaration: TEdgeLawDeclaration = {
  categoryNames: ['_services', '_utils'],
  externalAuthorizations: [],
  horizontalHierarchies: [[['_utils'], ['_services']]],
  rootFragmentPaths: ['src'],
  rootLayerPaths: ['lib'],
  treeOrigins: ['lib', 'src'],
};

const lawsOf = (
  violations: readonly TEdgeViolation[]
): readonly TEdgeLawName[] => violations.map((violation) => violation.law);

async function withCruisedFixture(
  files: Record<string, string>,
  assertResult: (violations: readonly TEdgeViolation[]) => void
): Promise<void> {
  const fixture = await createFixture({
    ...files,
    'tsconfig.json': FIXTURE_TSCONFIG,
  });
  try {
    const collected = await collectRelativeImports(fixture.path);
    const reason = collected.ok ? '' : collected.reason;
    expect(collected.ok, reason).toBe(true);
    if (!collected.ok) {
      return;
    }
    const violations = evaluateEdgeLaws(
      collected.collection.edges,
      declarationFromFafConfig(fafConfig),
      collected.collection.fragmentDirectories
    );
    assertResult(violations);
  } finally {
    await fixture.rm();
  }
}

describe('fitness: FAF edge laws', () => {
  it('reports no edge-law violations for repository sources, including specs', async () => {
    const collected = await collectRelativeImports(repositoryRoot);
    const reason = collected.ok ? '' : collected.reason;
    expect(collected.ok, reason).toBe(true);
    if (!collected.ok) {
      return;
    }
    expect(
      collected.collection.sources.some((source) => source.endsWith('.spec.ts'))
    ).toBe(true);
    const declaration = declarationFromFafConfig(fafConfig);
    expect(declaration.horizontalHierarchies).toEqual(
      fafConfig.faf.locals[0].horizontalHierarchies
    );
    expect(declaration.treeOrigins).toEqual(['src']);
    const violations = evaluateEdgeLaws(
      collected.collection.edges,
      declaration,
      collected.collection.fragmentDirectories
    );
    expect(violations, formatEdgeViolations(violations)).toEqual([]);
  });

  it('flags peer separation and lists every violated edge with the law', async () => {
    await withCruisedFixture(
      {
        'src/_utils/left/index.ts': 'export { left } from "./left.util.js";\n',
        'src/_utils/left/left.util.ts':
          "import { other } from '../other/index.js';\nimport { right } from '../right/index.js';\nexport const left = other + right;\n",
        'src/_utils/other/index.ts': 'export const other = 2;\n',
        'src/_utils/right/index.ts': 'export const right = 1;\n',
      },
      (violations) => {
        const peer = violations.filter(
          (violation) => violation.law === 'peer-separation'
        );
        expect(formatEdgeViolations(peer)).toBe(
          [
            'peer-separation: src/_utils/left/left.util.ts -> src/_utils/other/index.ts',
            'peer-separation: src/_utils/left/left.util.ts -> src/_utils/right/index.ts',
          ].join('\n')
        );
      }
    );
  });

  it('allows a category child to import that category fractal branch', async () => {
    await withCruisedFixture(
      {
        'src/_utils/_utils@shared/_types/shared.type.ts':
          'export type TShared = string;\n',
        'src/_utils/left/index.ts': 'export { left } from "./left.util.js";\n',
        'src/_utils/left/left.util.ts':
          "import type { TShared } from '../_utils@shared/_types/shared.type.js';\nexport const left: TShared = 'ok';\n",
      },
      (violations) => {
        expect(lawsOf(violations)).not.toContain('peer-separation');
        expect(lawsOf(violations)).not.toContain('encapsulation');
        expect(lawsOf(violations)).not.toContain('climb');
      }
    );
  });

  it('flags a private category importing a parent fragment node', async () => {
    await withCruisedFixture(
      {
        'src/widget/_utils/helper/helper.util.ts':
          "import { widget } from '../../widget.util.js';\nexport const helper = widget;\n",
        'src/widget/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
        'src/widget/index.ts': 'export { widget } from "./widget.util.js";\n',
        'src/widget/widget.util.ts': 'export const widget = 1;\n',
      },
      (violations) => {
        expect(formatEdgeViolations(violations)).toContain(
          'unidirectionality: src/widget/_utils/helper/helper.util.ts -> src/widget/widget.util.ts'
        );
      }
    );
  });

  it('flags a fractal branch importing another subtree of its parent', async () => {
    await withCruisedFixture(
      {
        'src/widget/_utils/other/index.ts': 'export const other = 1;\n',
        'src/widget/_widget@shared/_utils/helper/helper.util.ts':
          "import { other } from '../../../_utils/other/index.js';\nexport const helper = other;\n",
        'src/widget/_widget@shared/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
        'src/widget/index.ts': 'export const widget = 1;\n',
      },
      (violations) => {
        expect(lawsOf(violations)).toContain('unidirectionality');
        expect(formatEdgeViolations(violations)).toContain(
          'unidirectionality: src/widget/_widget@shared/_utils/helper/helper.util.ts -> src/widget/_utils/other/index.ts'
        );
      }
    );
  });

  it('allows a private category to import the parent fractal branch', async () => {
    await withCruisedFixture(
      {
        'src/widget/_utils/helper/helper.util.ts':
          "import type { TShared } from '../../_widget@shared/_types/shared.type.js';\nexport const helper: TShared = 'ok';\n",
        'src/widget/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
        'src/widget/_widget@shared/_types/shared.type.ts':
          'export type TShared = string;\n',
        'src/widget/index.ts': 'export const widget = 1;\n',
      },
      (violations) => {
        expect(lawsOf(violations)).not.toContain('unidirectionality');
      }
    );
  });

  it('flags encapsulation of a fragment, including from a spec', async () => {
    await withCruisedFixture(
      {
        'src/_utils/left/index.ts': 'export { left } from "./left.util.js";\n',
        'src/_utils/left/left.util.ts': 'export const left = 1;\n',
        'src/_utils/right/index.ts': 'export const right = 2;\n',
        'src/_utils/right/right.spec.ts':
          "import { left } from '../left/left.util.js';\nexport const used = left;\n",
        'src/main.ts':
          "import { left } from './_utils/left/left.util.js';\nexport const main = left;\n",
      },
      (violations) => {
        const encapsulation = violations.filter(
          (violation) => violation.law === 'encapsulation'
        );
        expect(formatEdgeViolations(encapsulation)).toBe(
          [
            'encapsulation: src/_utils/right/right.spec.ts -> src/_utils/left/left.util.ts',
            'encapsulation: src/main.ts -> src/_utils/left/left.util.ts',
          ].join('\n')
        );
      }
    );
  });

  it('allows importing a fragment only through its access node', async () => {
    await withCruisedFixture(
      {
        'src/_utils/left/index.ts': 'export { left } from "./left.util.js";\n',
        'src/_utils/left/left.spec.ts':
          "import { left } from './left.util.js';\nexport const used = left;\n",
        'src/_utils/left/left.util.ts': 'export const left = 1;\n',
        'src/main.ts':
          "import { left } from './_utils/left/index.js';\nexport const main = left;\n",
      },
      (violations) => {
        expect(lawsOf(violations)).not.toContain('encapsulation');
      }
    );
  });

  it('flags a climb that is not a fractal branch or a lower horizontal rank', async () => {
    await withCruisedFixture(
      {
        'src/_services/prepare/index.ts': 'export const prepare = 1;\n',
        'src/_utils/helper/helper.util.ts':
          "import { prepare } from '../../_services/prepare/index.js';\nexport const helper = prepare;\n",
        'src/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
      },
      (violations) => {
        expect(formatEdgeViolations(violations)).toContain(
          'climb: src/_utils/helper/helper.util.ts -> src/_services/prepare/index.ts'
        );
      }
    );
  });

  it('forbids an edge between private category siblings of different ranks', async () => {
    await withCruisedFixture(
      {
        'src/widget/_services/prepare/index.ts':
          'export { prepare } from "./prepare.service.js";\n',
        'src/widget/_services/prepare/prepare.service.ts':
          "import { helper } from '../../_utils/helper/index.js';\nexport const prepare = helper;\n",
        'src/widget/_utils/helper/helper.util.ts': 'export const helper = 1;\n',
        'src/widget/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
        'src/widget/index.ts': 'export const widget = 1;\n',
      },
      (violations) => {
        expect(formatEdgeViolations(violations)).toContain(
          'climb: src/widget/_services/prepare/prepare.service.ts -> src/widget/_utils/helper/index.ts'
        );
      }
    );
  });

  it('allows the same category-hierarchy edge between siblings in a fractal branch', async () => {
    await withCruisedFixture(
      {
        'src/_widget@shared/_services/prepare/index.ts':
          'export { prepare } from "./prepare.service.js";\n',
        'src/_widget@shared/_services/prepare/prepare.service.ts':
          "import { helper } from '../../_utils/helper/index.js';\nexport const prepare = helper;\n",
        'src/_widget@shared/_utils/helper/helper.util.ts':
          'export const helper = 1;\n',
        'src/_widget@shared/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
      },
      (violations) => {
        expect(lawsOf(violations)).not.toContain('climb');
        expect(lawsOf(violations)).not.toContain('peer-separation');
      }
    );
  });

  it('allows a fragment node and a sub-graph node to import their fragment private category', async () => {
    await withCruisedFixture(
      {
        'src/widget/_utils/helper/helper.util.ts': 'export const helper = 1;\n',
        'src/widget/_utils/helper/index.ts':
          'export { helper } from "./helper.util.js";\n',
        'src/widget/index.ts': 'export { widget } from "./widget.util.js";\n',
        'src/widget/widget.spec.ts':
          "import { helper } from './_utils/helper/index.js';\nexport const used = helper;\n",
        'src/widget/widget.util.ts':
          "import { helper } from './_utils/helper/index.js';\nexport const widget = helper;\n",
      },
      (violations) => {
        expect(lawsOf(violations)).not.toContain('climb');
        expect(lawsOf(violations)).not.toContain('peer-separation');
        expect(lawsOf(violations)).not.toContain('unidirectionality');
        expect(lawsOf(violations)).not.toContain('encapsulation');
      }
    );
  });

  it('orders non-private category siblings of a root layer or layer and not of a root fragment', () => {
    const violations = evaluateEdgeLaws(
      [
        {
          from: 'lib/_domain/_services/prepare/prepare.service.ts',
          to: 'lib/_domain/_utils/helper/index.ts',
        },
        {
          from: 'lib/_services/prepare/prepare.service.ts',
          to: 'lib/_utils/helper/index.ts',
        },
        {
          from: 'src/_services/prepare/prepare.service.ts',
          to: 'src/_utils/helper/index.ts',
        },
      ],
      categoryHierarchyDeclaration,
      []
    );
    expect(formatEdgeViolations(violations)).toBe(
      'climb: src/_services/prepare/prepare.service.ts -> src/_utils/helper/index.ts'
    );
  });

  it('allows a climb ordered by the subcategory hierarchy declared in fafconfig', async () => {
    await withCruisedFixture(
      {
        'src/_utils/_compounds/alpha/alpha.util.ts':
          "import { beta } from '../../_primitives/beta/index.js';\nexport const alpha = beta;\n",
        'src/_utils/_compounds/alpha/index.ts':
          'export { alpha } from "./alpha.util.js";\n',
        'src/_utils/_primitives/beta/beta.util.ts': 'export const beta = 1;\n',
        'src/_utils/_primitives/beta/index.ts':
          'export { beta } from "./beta.util.js";\n',
      },
      (violations) => {
        expect(lawsOf(violations)).not.toContain('climb');
        expect(lawsOf(violations)).not.toContain('peer-separation');
      }
    );
  });

  it('flags an unauthorized tree exit and allows the declared one', async () => {
    await withCruisedFixture(
      {
        'package.json': '{}\n',
        'secret.json': '{}\n',
        'src/main.ts':
          "import packageJson from '../package.json' with { type: 'json' };\nimport secret from '../secret.json' with { type: 'json' };\nexport const main = { packageJson, secret };\n",
      },
      (violations) => {
        const exits = violations.filter(
          (violation) => violation.law === 'tree-exit'
        );
        expect(formatEdgeViolations(exits)).toBe(
          'tree-exit: src/main.ts -> secret.json'
        );
      }
    );
  });
});

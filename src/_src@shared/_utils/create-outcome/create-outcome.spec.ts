import { describe, expect, it } from 'vitest';

import { createOutcome } from './create-outcome.util.js';

describe('createOutcome', () => {
  describe('four message forms as literal assertions', () => {
    it('formats the element form without detail as a literal message', () => {
      const outcome = createOutcome.unverified('unverified/symbolic-link', {
        element: 'src/_utils/link.ts',
        reason: 'symlink',
      });
      expect(outcome.message).toBe(
        "'src/_utils/link.ts' is a symbolic link within a tree"
      );
      expect(outcome.family).toBe('unverified');
      expect(outcome.normativeReference).toBe('FAF §3, §6.9');
    });

    it('formats the element form with detail and strips trailing period across families', () => {
      const withPeriod = createOutcome.unverified(
        'unverified/unresolved-import',
        {
          detail: 'Cannot find module ./missing.js.',
          element: 'src/main.ts',
          reason: 'missing',
        }
      );
      expect(withPeriod.message).toBe(
        "'src/main.ts' contains an import that could not be resolved: Cannot find module ./missing.js"
      );

      const withEmptyDetail = createOutcome.configuration(
        'configuration/missing-property',
        {
          detail: '',
          propertyPath: 'faf.locals[0].origin',
        }
      );
      expect(withEmptyDetail.message).toBe(
        "'faf.locals[0].origin' is required and missing"
      );

      const withNullDetail = createOutcome.configuration(
        'configuration/missing-property',
        {
          detail: null,
          propertyPath: 'faf.locals[0].origin',
        }
      );
      expect(withNullDetail.message).toBe(
        "'faf.locals[0].origin' is required and missing"
      );

      const configWithPeriod = createOutcome.configuration(
        'configuration/missing-property',
        {
          detail: 'Property missing.',
          propertyPath: 'faf.locals[0].origin',
        }
      );
      expect(configWithPeriod.message).toBe(
        "'faf.locals[0].origin' is required and missing: Property missing"
      );

      const clsWithPeriod = createOutcome.classification(
        'classification/unclassifiable-file',
        {
          detail: 'Unexpected extension.',
          element: 'src/weird.xyz',
        }
      );
      expect(clsWithPeriod.message).toBe(
        "'src/weird.xyz' is neither a uniquely classified Logical Node nor a Foreign Node: Unexpected extension"
      );

      const clsEmpty = createOutcome.classification(
        'classification/unclassifiable-file',
        {
          detail: '',
          element: 'src/weird.xyz',
        }
      );
      expect(clsEmpty.message).toBe(
        "'src/weird.xyz' is neither a uniquely classified Logical Node nor a Foreign Node"
      );

      const symWithPeriod = createOutcome.symbol('symbol/symbol-uniqueness', {
        detail: 'Two functions declared.',
        element: 'src/file.ts',
      });
      expect(symWithPeriod.message).toBe(
        "'src/file.ts' defines more than one Symbol in its root scope: Two functions declared"
      );

      const symEmpty = createOutcome.symbol('symbol/symbol-uniqueness', {
        detail: '',
        element: 'src/file.ts',
      });
      expect(symEmpty.message).toBe(
        "'src/file.ts' defines more than one Symbol in its root scope"
      );
    });

    it('formats the edge form as a literal message', () => {
      const outcome = createOutcome.edge('dependency/peer-separation', {
        from: 'src/first/first.util.ts',
        importIndex: 0,
        specifier: '../second/second.util.js',
        to: 'src/second/second.util.ts',
      });
      expect(outcome.message).toBe(
        "'src/first/first.util.ts' imports 'src/second/second.util.ts' through '../second/second.util.js': sibling subtrees may depend on each other only downward along a Horizontal Hierarchy"
      );
      expect(outcome.element).toBe('src/first/first.util.ts');
    });

    it('formats the path form as a literal message', () => {
      const outcome = createOutcome.path('dependency/re-entry-prohibition', {
        chain: ['src/a.ts', 'external/lib.ts', 'src/b.ts'],
        from: 'src/a.ts',
        importIndex: 2,
        to: 'src/b.ts',
      });
      expect(outcome.message).toBe(
        "'src/a.ts' reaches 'src/b.ts' through src/a.ts -> external/lib.ts -> src/b.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree"
      );
    });

    it('formats the cycle form with single and multiple segments', () => {
      const single = createOutcome.acyclicity('acyclicity/dependency-cycle', {
        cycle: [['src/a.ts', 'src/b.ts', 'src/a.ts']],
        element: 'src/a.ts',
      });
      expect(single.message).toBe(
        "'src/a.ts' is part of a dependency cycle: src/a.ts -> src/b.ts -> src/a.ts"
      );

      const multiple = createOutcome.acyclicity('acyclicity/inter-tree-cycle', {
        cycle: [
          ['treeA', 'treeB'],
          ['treeB', 'treeA'],
        ],
        element: 'treeA',
      });
      expect(multiple.message).toBe(
        "'treeA' is part of a dependency cycle between Fractal Trees: treeA -> treeB; treeB -> treeA"
      );
    });
  });

  describe('all outcome families and optional fields', () => {
    it('preserves optional position across acyclicity, classification, configuration, symbol, and unverified outcomes', () => {
      const pos = { column: 5, line: 12 };

      const acyc = createOutcome.acyclicity('acyclicity/dependency-cycle', {
        cycle: [['a.ts', 'b.ts', 'a.ts']],
        element: 'a.ts',
        position: pos,
      });
      expect(acyc.position).toEqual(pos);
      expect(acyc.family).toBe('acyclicity');

      const acycNoPos = createOutcome.acyclicity(
        'acyclicity/dependency-cycle',
        {
          cycle: [['a.ts', 'b.ts', 'a.ts']],
          element: 'a.ts',
        }
      );
      expect(acycNoPos.position).toBeUndefined();

      const cls = createOutcome.classification(
        'classification/unclassifiable-file',
        {
          element: 'unknown.txt',
          position: pos,
        }
      );
      expect(cls.position).toEqual(pos);
      expect(cls.family).toBe('classification');

      const clsNoPos = createOutcome.classification(
        'classification/unclassifiable-file',
        {
          element: 'unknown.txt',
        }
      );
      expect(clsNoPos.position).toBeUndefined();

      const configOutcome = createOutcome.configuration(
        'configuration/invalid-origin',
        {
          element: 'src',
          position: pos,
          propertyPath: 'faf.locals[0].rootLayers[0]',
        }
      );
      expect(configOutcome.element).toBe('src');
      expect(configOutcome.propertyPath).toBe('faf.locals[0].rootLayers[0]');
      expect(configOutcome.position).toEqual(pos);
      expect(configOutcome.family).toBe('configuration');

      const symWithDetails = createOutcome.symbol('symbol/symbol-uniqueness', {
        element: 'src/file.ts',
        position: pos,
        symbolCount: 2,
        symbolName: 'second',
      });
      expect(symWithDetails.symbolCount).toBe(2);
      expect(symWithDetails.symbolName).toBe('second');
      expect(symWithDetails.position).toEqual(pos);

      const symMinimal = createOutcome.symbol('symbol/re-export-prohibition', {
        element: 'src/node.ts',
      });
      expect(symMinimal.position).toBeUndefined();
      expect(symMinimal.symbolCount).toBeUndefined();
      expect(symMinimal.symbolName).toBeUndefined();

      const unverified = createOutcome.unverified('unverified/symbolic-link', {
        element: 'src/link',
        position: pos,
        reason: 'target',
      });
      expect(unverified.position).toEqual(pos);
      expect(unverified.reason).toBe('target');
    });

    it('handles edge-or-path constraint with path and edge facts', () => {
      const pathOutcome = createOutcome.path(
        'dependency/fractal-branch-unidirectionality',
        {
          chain: ['src/_shared/a.ts', 'src/master.ts'],
          from: 'src/_shared/a.ts',
          importIndex: 0,
          to: 'src/master.ts',
        }
      );
      expect(pathOutcome.constraint).toBe(
        'dependency/fractal-branch-unidirectionality'
      );
      expect(pathOutcome.chain).toEqual(['src/_shared/a.ts', 'src/master.ts']);
      expect(pathOutcome.specifier).toBeUndefined();

      const pos = { column: 2, line: 8 };
      const pathWithPosAndSpec = createOutcome.path(
        'dependency/tree-authorization',
        {
          chain: ['src/a.ts', 'ext.ts', 'lib/b.ts'],
          element: 'custom-path-element',
          from: 'src/a.ts',
          importIndex: 1,
          position: pos,
          specifier: '../ext.js',
          to: 'lib/b.ts',
        }
      );
      expect(pathWithPosAndSpec.element).toBe('custom-path-element');
      expect(pathWithPosAndSpec.position).toEqual(pos);
      expect(pathWithPosAndSpec.specifier).toBe('../ext.js');

      const edgeOutcome = createOutcome.edge('dependency/tree-authorization', {
        from: 'src/tree-a/a.ts',
        importIndex: 0,
        specifier: '../tree-b/b.js',
        to: 'src/tree-b/b.ts',
      });
      expect(edgeOutcome.constraint).toBe('dependency/tree-authorization');
      expect(edgeOutcome.chain).toBeUndefined();
      expect(edgeOutcome.specifier).toBe('../tree-b/b.js');
    });

    it('preserves optional element and position on dependency edge', () => {
      const pos = { column: 1, line: 5 };
      const outcome = createOutcome.edge('dependency/peer-separation', {
        element: 'custom-element',
        from: 'src/a.ts',
        importIndex: 0,
        position: pos,
        specifier: './b.js',
        to: 'src/b.ts',
      });
      expect(outcome.element).toBe('custom-element');
      expect(outcome.position).toEqual(pos);
    });

    it('formats horizontal hierarchy configuration catalog constraints', () => {
      const insufficient = createOutcome.configuration(
        'configuration/insufficient-hierarchy-tiers',
        { propertyPath: 'faf.common.horizontalHierarchyModels[0]' }
      );
      expect(insufficient.normativeReference).toBe('FAF §4');
      expect(insufficient.message).toBe(
        "'faf.common.horizontalHierarchyModels[0]' must declare at least two Rank tiers"
      );

      const invalidSubCategory = createOutcome.configuration(
        'configuration/invalid-sub-category-name',
        { propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]' }
      );
      expect(invalidSubCategory.normativeReference).toBe('FAF §4, §6.3.4');
      expect(invalidSubCategory.message).toBe(
        "'faf.common.horizontalHierarchyModels[0][0][0]' must be an underscore-prefixed kebab-case Sub-Category name"
      );

      const categoryConflict = createOutcome.configuration(
        'configuration/horizontal-hierarchy-model-category-conflict',
        {
          detail:
            'Sub-Category "_types" matches a Category in the role catalog.',
          propertyPath: 'faf.common.horizontalHierarchyModels[0][0][0]',
        }
      );
      expect(categoryConflict.normativeReference).toBe('FAF §6.3.4');
      expect(categoryConflict.message).toBe(
        '\'faf.common.horizontalHierarchyModels[0][0][0]\' cannot match a Category name declared in the role catalog: Sub-Category "_types" matches a Category in the role catalog'
      );
    });
  });
});

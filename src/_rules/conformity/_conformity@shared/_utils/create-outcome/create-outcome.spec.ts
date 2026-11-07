import { describe, expect, it } from 'vitest';

import { createOutcome } from './index.js';

describe('createOutcome', () => {
  describe('four message forms as literal assertions', () => {
    it('fosters the element form without detail as a literal message', () => {
      const outcome = createOutcome('unverified/symbolic-link', {
        element: 'src/_utils/link.ts',
        reason: 'symlink',
      });
      expect(outcome.message).toBe(
        "'src/_utils/link.ts' is a symbolic link within a tree"
      );
    });

    it('fosters the element form with detail as a literal message', () => {
      const outcome = createOutcome('unverified/unresolved-import', {
        detail: 'Cannot find module ./missing.js',
        element: 'src/main.ts',
        reason: 'missing',
      });
      expect(outcome.message).toBe(
        "'src/main.ts' contains an import that could not be resolved: Cannot find module ./missing.js"
      );
    });

    it('fosters the edge form as a literal message', () => {
      const outcome = createOutcome('dependency/peer-separation', {
        from: 'src/first/first.util.ts',
        importIndex: 0,
        specifier: '../second/second.util.js',
        to: 'src/second/second.util.ts',
      });
      expect(outcome.message).toBe(
        "'src/first/first.util.ts' imports 'src/second/second.util.ts' through '../second/second.util.js': sibling subtrees may depend on each other only downward along a Horizontal Hierarchy"
      );
    });

    it('fosters the path form as a literal message', () => {
      const outcome = createOutcome('dependency/re-entry-prohibition', {
        chain: ['src/a.ts', 'external/lib.ts', 'src/b.ts'],
        from: 'src/a.ts',
        importIndex: 2,
        to: 'src/b.ts',
      });
      expect(outcome.message).toBe(
        "'src/a.ts' reaches 'src/b.ts' through src/a.ts -> external/lib.ts -> src/b.ts: a path through local files outside all Fractal Trees must not re-enter its Fractal Tree"
      );
    });

    it('fosters the cycle form as a literal message', () => {
      const outcome = createOutcome('acyclicity/dependency-cycle', {
        cycle: [['src/a.ts', 'src/b.ts', 'src/a.ts']],
        element: 'src/a.ts',
      });
      expect(outcome.message).toBe(
        "'src/a.ts' is part of a dependency cycle: src/a.ts -> src/b.ts -> src/a.ts"
      );
    });
  });

  describe('at least one literal message per outcome family', () => {
    it('fosters literal message and catalog metadata for configuration', () => {
      const outcome = createOutcome('configuration/missing-property', {
        propertyPath: 'faf.locals[0].origin',
      });
      expect(outcome.constraint).toBe('configuration/missing-property');
      expect(outcome.family).toBe('configuration');
      expect(outcome.normativeReference).toBe('D-14');
      expect(outcome.element).toBe('faf.locals[0].origin');
      expect(outcome.propertyPath).toBe('faf.locals[0].origin');
      expect(outcome.message).toBe(
        "'faf.locals[0].origin' is required and missing"
      );
    });

    it('fosters literal message and catalog metadata for classification', () => {
      const outcome = createOutcome('classification/unclassifiable-directory', {
        element: 'src/unknown',
      });
      expect(outcome.constraint).toBe(
        'classification/unclassifiable-directory'
      );
      expect(outcome.family).toBe('classification');
      expect(outcome.normativeReference).toBe('FAF §6.9');
      expect(outcome.element).toBe('src/unknown');
      expect(outcome.message).toBe(
        "'src/unknown' has no unique Logical Domain classification"
      );
    });

    it('fosters literal message and catalog metadata for symbol', () => {
      const outcome = createOutcome('symbol/symbol-uniqueness', {
        element: 'src/module.ts',
        symbolCount: 3,
        symbolName: 'extraSymbol',
      });
      expect(outcome.constraint).toBe('symbol/symbol-uniqueness');
      expect(outcome.family).toBe('symbol');
      expect(outcome.normativeReference).toBe('FAF §5');
      expect(outcome.element).toBe('src/module.ts');
      expect(outcome.symbolCount).toBe(3);
      expect(outcome.symbolName).toBe('extraSymbol');
      expect(outcome.message).toBe(
        "'src/module.ts' defines more than one Symbol in its root scope"
      );
    });

    it('fosters literal message and catalog metadata for dependency', () => {
      const outcome = createOutcome('dependency/fragment-encapsulation', {
        from: 'src/consumer.ts',
        importIndex: 1,
        specifier: './widget/_utils/helper.js',
        to: 'src/widget/_utils/helper.ts',
      });
      expect(outcome.constraint).toBe('dependency/fragment-encapsulation');
      expect(outcome.family).toBe('dependency');
      expect(outcome.normativeReference).toBe('FAF §6.1.1');
      expect(outcome.from).toBe('src/consumer.ts');
      expect(outcome.to).toBe('src/widget/_utils/helper.ts');
      expect(outcome.specifier).toBe('./widget/_utils/helper.js');
      expect(outcome.importIndex).toBe(1);
      expect(outcome.message).toBe(
        "'src/consumer.ts' imports 'src/widget/_utils/helper.ts' through './widget/_utils/helper.js': a Fragment is importable from outside only through its index.ts"
      );
    });

    it('fosters literal message and catalog metadata for acyclicity', () => {
      const outcome = createOutcome('acyclicity/inter-tree-cycle', {
        cycle: [
          ['treeA', 'treeB'],
          ['treeB', 'treeA'],
        ],
        element: 'treeA',
      });
      expect(outcome.constraint).toBe('acyclicity/inter-tree-cycle');
      expect(outcome.family).toBe('acyclicity');
      expect(outcome.normativeReference).toBe('FAF §7.2');
      expect(outcome.element).toBe('treeA');
      expect(outcome.cycle).toEqual([
        ['treeA', 'treeB'],
        ['treeB', 'treeA'],
      ]);
      expect(outcome.message).toBe(
        "'treeA' is part of a dependency cycle between Fractal Trees: treeA -> treeB; treeB -> treeA"
      );
    });

    it('fosters literal message and catalog metadata for unverified', () => {
      const outcome = createOutcome('unverified/config-loading-timeout', {
        element: 'fafconfig.ts',
        reason: 'timeout exceeded',
      });
      expect(outcome.constraint).toBe('unverified/config-loading-timeout');
      expect(outcome.family).toBe('unverified');
      expect(outcome.normativeReference).toBe('D-09');
      expect(outcome.element).toBe('fafconfig.ts');
      expect(outcome.reason).toBe('timeout exceeded');
      expect(outcome.message).toBe(
        "'fafconfig.ts' timed out during configuration loading"
      );
    });
  });

  describe('additional options and edge-or-path branching', () => {
    it('preserves optional position in acyclicity outcomes', () => {
      const pos = { column: 5, line: 12 };
      const outcome = createOutcome('acyclicity/dependency-cycle', {
        cycle: [['a.ts', 'b.ts', 'a.ts']],
        element: 'a.ts',
        position: pos,
      });
      expect(outcome.position).toEqual(pos);
    });

    it('preserves optional position in classification outcomes', () => {
      const pos = { column: 1, line: 1 };
      const outcome = createOutcome('classification/unclassifiable-file', {
        element: 'unknown.txt',
        position: pos,
      });
      expect(outcome.position).toEqual(pos);
    });

    it('preserves custom element and position in configuration outcomes', () => {
      const pos = { column: 2, line: 3 };
      const outcome = createOutcome('configuration/invalid-origin', {
        element: 'src',
        position: pos,
        propertyPath: 'faf.locals[0].rootLayers[0]',
      });
      expect(outcome.element).toBe('src');
      expect(outcome.propertyPath).toBe('faf.locals[0].rootLayers[0]');
      expect(outcome.position).toEqual(pos);
    });

    it('preserves position in symbol outcomes without symbolCount or symbolName', () => {
      const pos = { column: 4, line: 2 };
      const outcome = createOutcome('symbol/re-export-prohibition', {
        element: 'src/node.ts',
        position: pos,
      });
      expect(outcome.position).toEqual(pos);
      expect(outcome.symbolCount).toBeUndefined();
      expect(outcome.symbolName).toBeUndefined();
    });

    it('preserves position in unverified outcomes', () => {
      const pos = { column: 10, line: 15 };
      const outcome = createOutcome('unverified/symbolic-link', {
        element: 'src/link',
        position: pos,
        reason: 'target',
      });
      expect(outcome.position).toEqual(pos);
    });

    it('handles edge-or-path constraint with path facts', () => {
      const outcome = createOutcome(
        'dependency/fractal-branch-unidirectionality',
        {
          chain: ['src/_shared/a.ts', 'src/master.ts'],
          from: 'src/_shared/a.ts',
          importIndex: 0,
          to: 'src/master.ts',
        }
      );
      expect(outcome.constraint).toBe(
        'dependency/fractal-branch-unidirectionality'
      );
      expect(outcome.chain).toEqual(['src/_shared/a.ts', 'src/master.ts']);
      expect(outcome.message).toBe(
        "'src/_shared/a.ts' reaches 'src/master.ts' through src/_shared/a.ts -> src/master.ts: a Fractal Branch must not depend on the other subtrees of its parent"
      );
    });

    it('handles edge-or-path constraint with edge facts', () => {
      const outcome = createOutcome('dependency/tree-authorization', {
        from: 'src/tree-a/a.ts',
        importIndex: 0,
        specifier: '../tree-b/b.js',
        to: 'src/tree-b/b.ts',
      });
      expect(outcome.constraint).toBe('dependency/tree-authorization');
      expect(outcome.chain).toBeUndefined();
      expect(outcome.specifier).toBe('../tree-b/b.js');
      expect(outcome.message).toBe(
        "'src/tree-a/a.ts' imports 'src/tree-b/b.ts' through '../tree-b/b.js': a dependency between Fractal Trees requires an oriented treeDependencies authorization"
      );
    });

    it('preserves optional element and position on dependency edge', () => {
      const pos = { column: 1, line: 5 };
      const outcome = createOutcome('dependency/peer-separation', {
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
  });
});

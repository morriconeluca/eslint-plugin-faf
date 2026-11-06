import { describe, expect, it } from 'vitest';

import { validateOrigins } from './validate-origins.util.js';

describe('validateOrigins', () => {
  it('returns empty outcomes for empty origins list', () => {
    const outcomes = validateOrigins([]);
    expect(outcomes).toHaveLength(0);
  });

  it('returns empty outcomes for mutually disjoint origins', () => {
    const outcomes = validateOrigins([
      {
        kind: 'root-layer',
        path: 'packages/a/src',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      },
      {
        kind: 'root-layer',
        path: 'packages/b/src',
        propertyPath: 'faf.locals[0].rootLayers[1]',
      },
      {
        kind: 'root-fragment',
        path: 'app',
        propertyPath: 'faf.locals[1].rootFragments[0]',
      },
    ]);
    expect(outcomes).toHaveLength(0);
  });

  it('detects duplicate origin declared with same kind', () => {
    const outcomes = validateOrigins([
      {
        kind: 'root-layer',
        path: 'src',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      },
      {
        kind: 'root-layer',
        path: 'src',
        propertyPath: 'faf.locals[1].rootLayers[0]',
      },
    ]);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'configuration/duplicate-origin',
      element: 'src',
      family: 'configuration',
      message: "'src' is declared more than once as a tree origin",
      normativeReference: 'D-06',
      propertyPath: 'faf.locals[1].rootLayers[0]',
    });
  });

  it('detects conflicting origin kind when declared as both Root Layer and Root Fragment', () => {
    const outcomes = validateOrigins([
      {
        kind: 'root-layer',
        path: 'src',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      },
      {
        kind: 'root-fragment',
        path: 'src',
        propertyPath: 'faf.locals[1].rootFragments[0]',
      },
    ]);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'configuration/conflicting-origin-kind',
      element: 'src',
      family: 'configuration',
      message:
        "'src' cannot be declared as both a Root Layer and a Root Fragment",
      normativeReference: 'D-06',
      propertyPath: 'faf.locals[1].rootFragments[0]',
    });
  });

  it('detects contained origin based on path segments', () => {
    const outcomes = validateOrigins([
      {
        kind: 'root-fragment',
        path: 'src',
        propertyPath: 'faf.locals[0].rootFragments[0]',
      },
      {
        kind: 'root-fragment',
        path: 'src/app',
        propertyPath: 'faf.locals[0].rootFragments[1]',
      },
    ]);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'configuration/overlapping-origins',
      element: 'src/app',
      family: 'configuration',
      message:
        "'src/app' overlaps with another declared tree origin: Origin 'src/app' is contained within origin 'src'",
      normativeReference: 'D-06',
      propertyPath: 'faf.locals[0].rootFragments[1]',
    });
  });

  it('detects containment when parent origin is dot', () => {
    const outcomes = validateOrigins([
      {
        kind: 'root-layer',
        path: '.',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      },
      {
        kind: 'root-fragment',
        path: 'src',
        propertyPath: 'faf.locals[1].rootFragments[0]',
      },
    ]);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'configuration/overlapping-origins',
      element: 'src',
      family: 'configuration',
      message:
        "'src' overlaps with another declared tree origin: Origin 'src' is contained within origin '.'",
      normativeReference: 'D-06',
      propertyPath: 'faf.locals[1].rootFragments[0]',
    });
  });

  it('does not treat prefix-matching segment names as contained', () => {
    const outcomes = validateOrigins([
      {
        kind: 'root-layer',
        path: 'packages/a',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      },
      {
        kind: 'root-layer',
        path: 'packages/a-b',
        propertyPath: 'faf.locals[0].rootLayers[1]',
      },
    ]);
    expect(outcomes).toHaveLength(0);
  });
});

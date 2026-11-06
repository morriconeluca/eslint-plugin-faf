import { describe, expect, it } from 'vitest';

import type { TConfigConstraint } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../../../../../../../../../_conformity@shared/_configs/outcome-catalog.config.js';
import { validateMimeticStructures } from './validate-mimetic-structures.schema.js';

describe('validateMimeticStructures', () => {
  it('does nothing when mimeticStructures is undefined', () => {
    const outcomes = validateMimeticStructures(undefined, 'faf.common');
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid mimetic structures with and without actions', () => {
    const outcomes = validateMimeticStructures(
      [
        {
          actions: ['get', 'post', 'delete'],
          paths: ['src/_src@shared/_network/_apis'],
        },
        {
          paths: ['src/_src@shared/_ui/_pages'],
        },
      ],
      'faf.common'
    );
    expect(outcomes).toHaveLength(0);
  });

  const testCases: readonly {
    readonly constraint: TConfigConstraint;
    readonly message: string;
    readonly normativeReference: string;
    readonly payload: unknown;
    readonly propertyPath: string;
  }[] = [
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "mimeticPathStructures" cannot be null.',
      normativeReference: 'D-14',
      payload: null,
      propertyPath: 'faf.common.mimeticPathStructures',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "mimeticPathStructures" must be an array.',
      normativeReference: 'D-14',
      payload: 'invalid',
      propertyPath: 'faf.common.mimeticPathStructures',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Mimetic path structure element cannot be null.',
      normativeReference: 'D-14',
      payload: [null],
      propertyPath: 'faf.common.mimeticPathStructures[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Mimetic path structure element must be an object.',
      normativeReference: 'D-14',
      payload: ['invalid'],
      propertyPath: 'faf.common.mimeticPathStructures[0]',
    },
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'D-14',
      payload: [{ extra: true, paths: ['src'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].extra',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "paths" cannot be null.',
      normativeReference: 'D-14',
      payload: [{ paths: null }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "paths" is missing.',
      normativeReference: 'D-14',
      payload: [{}],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "paths" must be an array.',
      normativeReference: 'D-14',
      payload: [{ paths: 'src' }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/empty-list',
      message: 'Property "paths" cannot be empty.',
      normativeReference: 'D-14',
      payload: [{ paths: [] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Path element cannot be null.',
      normativeReference: 'D-14',
      payload: [{ paths: [null] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Path element must be a string.',
      normativeReference: 'D-14',
      payload: [{ paths: [123] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Path element cannot be empty.',
      normativeReference: 'D-14',
      payload: [{ paths: [''] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'D-05',
      payload: [{ paths: ['./src'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate path "src/_apis".',
      normativeReference: 'D-14',
      payload: [{ paths: ['src/_apis', 'src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[1]',
    },
    {
      constraint: 'configuration/duplicate-mimetic-path',
      message:
        'Path "src/_apis" is declared in multiple mimetic path structures.',
      normativeReference: 'FAF §6.3.5',
      payload: [{ paths: ['src/_apis'] }, { paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[1].paths[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "actions" must be an array.',
      normativeReference: 'D-14',
      payload: [{ actions: 'get', paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions',
    },
    {
      constraint: 'configuration/empty-list',
      message: 'Property "actions" cannot be empty when present.',
      normativeReference: 'D-14',
      payload: [{ actions: [], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Action element cannot be null.',
      normativeReference: 'D-14',
      payload: [{ actions: [null], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Action element must be a string.',
      normativeReference: 'D-14',
      payload: [{ actions: [123], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Action element cannot be empty.',
      normativeReference: 'D-14',
      payload: [{ actions: [''], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/invalid-action-name',
      message: 'Action "get user" must be in kebab-case.',
      normativeReference: 'FAF §6.3.5',
      payload: [{ actions: ['get user'], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/invalid-action-name',
      message: 'Action "getUser" must be in kebab-case.',
      normativeReference: 'FAF §6.3.5',
      payload: [{ actions: ['getUser'], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate action "get".',
      normativeReference: 'D-14',
      payload: [{ actions: ['get', 'get'], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[1]',
    },
  ];

  it.each(testCases)(
    'rejects invalid mimetic structure producing $constraint',
    ({ constraint, payload, propertyPath }) => {
      const outcomes = validateMimeticStructures(payload, 'faf.common');
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(
        OUTCOME_CATALOG[constraint].normativeReference
      );
      expect(outcome?.message).toContain(propertyPath);
    }
  );

  it('rejects explicit undefined in mimetic structure', () => {
    const mimeticRecord: Record<string, unknown> = { paths: ['src/_apis'] };
    Object.defineProperty(mimeticRecord, 'actions', {
      enumerable: true,
      value: void 0,
    });
    const outcomes = validateMimeticStructures([mimeticRecord], 'faf.common');
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('D-14');
    expect(outcome?.propertyPath).toBe(
      'faf.common.mimeticPathStructures[0].actions'
    );
    expect(outcome?.message).toBe(
      "'faf.common.mimeticPathStructures[0].actions' cannot be explicitly undefined"
    );
  });
});

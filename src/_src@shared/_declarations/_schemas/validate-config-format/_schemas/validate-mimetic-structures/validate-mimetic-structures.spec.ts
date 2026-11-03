import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { validateMimeticStructures } from './validate-mimetic-structures.schema.js';

describe('validateMimeticStructures', () => {
  it('does nothing when mimeticStructures is undefined', () => {
    const outcomes: TConfigOutcome[] = [];
    validateMimeticStructures(undefined, 'faf.common', outcomes);
    expect(outcomes).toHaveLength(0);
  });

  it('accepts valid mimetic structures with and without actions', () => {
    const outcomes: TConfigOutcome[] = [];
    validateMimeticStructures(
      [
        {
          actions: ['get', 'post', 'delete'],
          paths: ['src/_src@shared/_network/_apis'],
        },
        {
          paths: ['src/_src@shared/_ui/_pages'],
        },
      ],
      'faf.common',
      outcomes
    );
    expect(outcomes).toHaveLength(0);
  });

  it.each([
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "mimeticPathStructures" cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: null,
      propertyPath: 'faf.common.mimeticPathStructures',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "mimeticPathStructures" must be an array.',
      normativeReference: 'CONFIG_2',
      payload: 'invalid',
      propertyPath: 'faf.common.mimeticPathStructures',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Mimetic path structure element cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [null],
      propertyPath: 'faf.common.mimeticPathStructures[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Mimetic path structure element must be an object.',
      normativeReference: 'CONFIG_2',
      payload: ['invalid'],
      propertyPath: 'faf.common.mimeticPathStructures[0]',
    },
    {
      constraint: 'configuration/unknown-property',
      message: 'Unknown property "extra" is forbidden.',
      normativeReference: 'CONFIG_8',
      payload: [{ extra: true, paths: ['src'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].extra',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Property "paths" cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [{ paths: null }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/missing-property',
      message: 'Required property "paths" is missing.',
      normativeReference: 'CONFIG_8',
      payload: [{}],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "paths" must be an array.',
      normativeReference: 'CONFIG_2',
      payload: [{ paths: 'src' }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/empty-list',
      message: 'Property "paths" cannot be empty.',
      normativeReference: 'CONFIG_8',
      payload: [{ paths: [] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Path element cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [{ paths: [null] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Path element must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [{ paths: [123] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Path element cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [{ paths: [''] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/invalid-literal-path',
      message: 'Invalid literal config path "./src".',
      normativeReference: 'CONFIG_2_2',
      payload: [{ paths: ['./src'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate path "src/_apis".',
      normativeReference: 'CONFIG_2',
      payload: [{ paths: ['src/_apis', 'src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].paths[1]',
    },
    {
      constraint: 'configuration/duplicate-mimetic-path',
      message:
        'Path "src/_apis" is declared in multiple mimetic path structures.',
      normativeReference: 'CONFIG_8',
      payload: [{ paths: ['src/_apis'] }, { paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[1].paths[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Property "actions" must be an array.',
      normativeReference: 'CONFIG_2',
      payload: [{ actions: 'get', paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions',
    },
    {
      constraint: 'configuration/empty-list',
      message: 'Property "actions" cannot be empty when present.',
      normativeReference: 'CONFIG_8',
      payload: [{ actions: [], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions',
    },
    {
      constraint: 'configuration/null-forbidden',
      message: 'Action element cannot be null.',
      normativeReference: 'CONFIG_2',
      payload: [{ actions: [null], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/invalid-type',
      message: 'Action element must be a string.',
      normativeReference: 'CONFIG_2',
      payload: [{ actions: [123], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/empty-string',
      message: 'Action element cannot be empty.',
      normativeReference: 'CONFIG_2',
      payload: [{ actions: [''], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/invalid-action-name',
      message: 'Action "get user" must be in kebab-case.',
      normativeReference: 'CONFIG_8',
      payload: [{ actions: ['get user'], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/invalid-action-name',
      message: 'Action "getUser" must be in kebab-case.',
      normativeReference: 'CONFIG_8',
      payload: [{ actions: ['getUser'], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[0]',
    },
    {
      constraint: 'configuration/duplicate-element',
      message: 'Duplicate action "get".',
      normativeReference: 'CONFIG_8',
      payload: [{ actions: ['get', 'get'], paths: ['src/_apis'] }],
      propertyPath: 'faf.common.mimeticPathStructures[0].actions[1]',
    },
  ])(
    'rejects invalid mimetic structure producing $constraint',
    ({ constraint, message, normativeReference, payload, propertyPath }) => {
      const outcomes: TConfigOutcome[] = [];
      validateMimeticStructures(payload, 'faf.common', outcomes);
      expect(outcomes.length).toBeGreaterThanOrEqual(1);
      const outcome = outcomes.find(
        (o) => o.constraint === constraint && o.propertyPath === propertyPath
      );
      expect(outcome).toBeDefined();
      expect(outcome?.family).toBe('configuration');
      expect(outcome?.element).toBe(propertyPath);
      expect(outcome?.normativeReference).toBe(normativeReference);
      expect(outcome?.message).toBe(message);
    }
  );

  it('rejects explicit undefined in mimetic structure', () => {
    const outcomes: TConfigOutcome[] = [];
    const mimeticRecord: Record<string, unknown> = { paths: ['src/_apis'] };
    Object.defineProperty(mimeticRecord, 'actions', {
      enumerable: true,
      value: void 0,
    });
    validateMimeticStructures([mimeticRecord], 'faf.common', outcomes);
    expect(
      outcomes.some((o) => o.constraint === 'configuration/explicit-undefined')
    ).toBe(true);
    const outcome = outcomes.find(
      (o) => o.constraint === 'configuration/explicit-undefined'
    );
    expect(outcome?.family).toBe('configuration');
    expect(outcome?.normativeReference).toBe('CONFIG_2');
    expect(outcome?.propertyPath).toBe(
      'faf.common.mimeticPathStructures[0].actions'
    );
    expect(outcome?.message).toBe(
      'Property "actions" cannot be explicitly undefined.'
    );
  });
});

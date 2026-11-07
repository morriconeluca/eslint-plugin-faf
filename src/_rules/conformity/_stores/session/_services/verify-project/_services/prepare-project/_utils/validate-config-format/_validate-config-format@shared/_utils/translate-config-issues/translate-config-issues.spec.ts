import { describe, expect, it } from 'vitest';

import { DIAGNOSTIC_PREFIX } from '../../_constants/config-diagnostic.constant.js';
import { translateConfigIssues } from './translate-config-issues.util.js';

const encode = (diagnostic: unknown): string =>
  `${DIAGNOSTIC_PREFIX}${JSON.stringify(diagnostic)}`;

describe('translateConfigIssues', () => {
  it('prefixes a fixed diagnostic with the caller base path', () => {
    const outcomes = translateConfigIssues(
      [
        {
          code: 'custom',
          message: encode({
            constraint: 'configuration/invalid-literal-path',
            kind: 'fixed',
          }),
          path: [0],
        },
      ],
      ['./src'],
      'faf.locals[0].rootLayers'
    );

    expect(outcomes).toEqual([
      {
        constraint: 'configuration/invalid-literal-path',
        element: 'faf.locals[0].rootLayers[0]',
        family: 'configuration',
        message:
          "'faf.locals[0].rootLayers[0]' must be a POSIX relative path without empty or parent segments",
        normativeReference: 'D-05',
        propertyPath: 'faf.locals[0].rootLayers[0]',
      },
    ]);
  });

  it('expands unrecognized keys into one outcome per key', () => {
    const outcomes = translateConfigIssues(
      [
        {
          code: 'unrecognized_keys',
          keys: ['trees'],
          message: encode({
            constraint: 'configuration/unknown-property',
            kind: 'keys',
          }),
          path: [],
        },
      ],
      { trees: [] },
      ''
    );

    expect(outcomes[0]?.propertyPath).toBe('trees');
    expect(outcomes[0]?.message).toBe("'trees' is not a recognized property");
    expect(outcomes[0]?.normativeReference).toBe('D-14');
  });

  it('rejects a key diagnostic that is not an unrecognized-keys issue', () => {
    expect(() =>
      translateConfigIssues(
        [
          {
            code: 'custom',
            message: encode({
              constraint: 'configuration/unknown-property',
              kind: 'keys',
            }),
            path: ['faf'],
          },
        ],
        { faf: {} },
        ''
      )
    ).toThrow('Key diagnostic requires unrecognized keys.');
  });

  it('maps an empty tuple issue to empty-list on the parent path', () => {
    const outcomes = translateConfigIssues(
      [
        {
          code: 'invalid_type',
          expected: 'string',
          message: encode({
            emptyList: {
              constraint: 'configuration/empty-list',
              kind: 'fixed',
            },
            explicit: {
              constraint: 'configuration/explicit-undefined',
              kind: 'fixed',
            },
            invalid: {
              constraint: 'configuration/invalid-type',
              kind: 'fixed',
            },
            kind: 'absent',
            missing: {
              constraint: 'configuration/missing-property',
              kind: 'fixed',
            },
          }),
          path: ['paths', 0],
        },
      ],
      { paths: [] },
      'faf.common.foreignNodes[0]'
    );

    expect(outcomes[0]?.constraint).toBe('configuration/empty-list');
    expect(outcomes[0]?.propertyPath).toBe('faf.common.foreignNodes[0].paths');
    expect(outcomes[0]?.message).toBe(
      "'faf.common.foreignNodes[0].paths' cannot be an empty list"
    );
  });

  it('does not treat a non-empty parent array as an empty tuple', () => {
    const outcomes = translateConfigIssues(
      [
        {
          code: 'invalid_type',
          expected: 'string',
          message: encode({
            emptyList: {
              constraint: 'configuration/empty-list',
              kind: 'fixed',
            },
            explicit: {
              constraint: 'configuration/explicit-undefined',
              kind: 'fixed',
            },
            invalid: {
              constraint: 'configuration/invalid-type',
              kind: 'fixed',
            },
            kind: 'absent',
            missing: {
              constraint: 'configuration/missing-property',
              kind: 'fixed',
            },
          }),
          path: ['locals', 0, 'name'],
        },
      ],
      { locals: [{ name: 'util' }] },
      'faf'
    );
    expect(outcomes[0]?.constraint).toBe('configuration/explicit-undefined');
    expect(outcomes[0]?.propertyPath).toBe('faf.locals[0].name');
  });

  it('keeps a non-empty array index on the element path', () => {
    const outcomes = translateConfigIssues(
      [
        {
          code: 'invalid_type',
          expected: 'string',
          message: encode({
            emptyList: {
              constraint: 'configuration/empty-list',
              kind: 'fixed',
            },
            explicit: {
              constraint: 'configuration/explicit-undefined',
              kind: 'fixed',
            },
            invalid: {
              constraint: 'configuration/invalid-type',
              kind: 'fixed',
            },
            kind: 'absent',
            missing: {
              constraint: 'configuration/missing-property',
              kind: 'fixed',
            },
          }),
          path: [0],
        },
      ],
      ['src'],
      'faf.locals'
    );
    expect(outcomes[0]?.constraint).toBe('configuration/missing-property');
    expect(outcomes[0]?.propertyPath).toBe('faf.locals[0]');
  });
});

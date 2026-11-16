import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { DIAGNOSTIC_PREFIX } from './config-diagnostic-codec.constant.js';
import { formFields } from './config-diagnostic-codec.schema.js';
import { translateConfigIssues } from './config-diagnostic-codec.util.js';

const encode = (diagnostic: unknown): string =>
  `${DIAGNOSTIC_PREFIX}${JSON.stringify(diagnostic)}`;

describe('configDiagnosticCodec', () => {
  describe('formFields', () => {
    it('rejects null, explicit undefined, and accepts a missing key', () => {
      const object = z.strictObject({
        roles: formFields.optionalProperty(),
      });
      expect(object.safeParse({}).success).toBe(true);
      expect(object.safeParse({ roles: null }).success).toBe(false);
      expect(object.safeParse({ roles: 'util' }).success).toBe(true);
      const explicit: Record<string, unknown> = {};
      Object.defineProperty(explicit, 'roles', {
        enumerable: true,
        value: void 0,
      });
      expect(object.safeParse(explicit).success).toBe(false);
    });

    it('distinguishes a missing required string from null', () => {
      const name = formFields.requiredText();
      expect(name.safeParse('util').success).toBe(true);
      expect(name.safeParse(undefined).success).toBe(false);
      expect(name.safeParse(null).success).toBe(false);
      expect(name.safeParse('').success).toBe(false);
    });

    it('rejects null, a non-string, and an empty string', () => {
      const text = formFields.textValue();
      expect(text.safeParse('src').success).toBe(true);
      expect(text.safeParse('').success).toBe(false);
      expect(text.safeParse(null).success).toBe(false);
      expect(text.safeParse(1).success).toBe(false);
    });

    it('encodes a keys diagnostic', () => {
      expect(
        formFields.encode({
          constraint: 'configuration/unknown-property',
          kind: 'keys',
        })
      ).toContain('"kind":"keys"');
    });

    it('handles presenceIssue for null, undefined, and other inputs', () => {
      expect(formFields.presenceIssue(null)).toContain('null-forbidden');
      expect(formFields.presenceIssue(undefined)).toContain(
        'explicit-undefined'
      );
      expect(formFields.presenceIssue(123)).toContain('invalid-type');
    });

    it('checks non-empty strings and literal config path syntax', () => {
      expect(formFields.isNonEmptyString('src')).toBe(true);
      expect(formFields.isNonEmptyString('')).toBe(false);
      expect(formFields.isNonEmptyString(1)).toBe(false);

      expect(formFields.isLiteralPath('.')).toBe(true);
      expect(formFields.isLiteralPath('src')).toBe(true);
      expect(formFields.isLiteralPath('src/app/[todoId]')).toBe(true);
      expect(formFields.isLiteralPath('src/app/(auth)')).toBe(true);
      expect(formFields.isLiteralPath('src/_apis/_[todo-id]')).toBe(true);
      expect(formFields.isLiteralPath('src/_src@shared')).toBe(true);
      expect(formFields.isLiteralPath('a/b/c')).toBe(true);

      expect(formFields.isLiteralPath('/src')).toBe(false);
      expect(formFields.isLiteralPath('./src')).toBe(false);
      expect(formFields.isLiteralPath('src/')).toBe(false);
      expect(formFields.isLiteralPath('src//app')).toBe(false);
      expect(formFields.isLiteralPath('src/./app')).toBe(false);
      expect(formFields.isLiteralPath('src/../app')).toBe(false);
      expect(formFields.isLiteralPath('../src')).toBe(false);
      expect(formFields.isLiteralPath('')).toBe(false);
      expect(formFields.isLiteralPath('..')).toBe(false);
      expect(formFields.isLiteralPath('/')).toBe(false);
      expect(formFields.isLiteralPath('//')).toBe(false);
      expect(formFields.isLiteralPath('./')).toBe(false);
      expect(formFields.isLiteralPath('/.')).toBe(false);
      expect(formFields.isLiteralPath('.//.')).toBe(false);
      expect(formFields.isLiteralPath('src\\app')).toBe(false);
    });
  });

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
          normativeReference: 'FAF §1.2, §6.9',
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
      expect(outcomes[0]?.normativeReference).toBe('FAF §1.2, §6.9');
    });

    it('rejects missing prefix, invalid diagnostic payload, or key diagnostic without unrecognized_keys', () => {
      expect(() =>
        translateConfigIssues(
          [
            {
              code: 'custom',
              message: 'not-a-diagnostic',
              path: ['faf'],
            },
          ],
          { faf: {} },
          ''
        )
      ).toThrow('Zod issue is missing a configuration diagnostic.');

      expect(() =>
        translateConfigIssues(
          [
            {
              code: 'custom',
              message: `${DIAGNOSTIC_PREFIX}[]`,
              path: ['faf'],
            },
          ],
          { faf: {} },
          ''
        )
      ).toThrow('Configuration diagnostic payload is invalid.');

      expect(() =>
        translateConfigIssues(
          [
            {
              code: 'custom',
              message: `${DIAGNOSTIC_PREFIX}${JSON.stringify({ constraint: 'x' })}`,
              path: ['faf'],
            },
          ],
          { faf: {} },
          ''
        )
      ).toThrow('Configuration diagnostic payload is invalid.');

      expect(() =>
        translateConfigIssues(
          [
            {
              code: 'custom',
              message: `${DIAGNOSTIC_PREFIX}${JSON.stringify({ kind: 'other' })}`,
              path: ['faf'],
            },
          ],
          { faf: {} },
          ''
        )
      ).toThrow('Configuration diagnostic payload is invalid.');

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

    it('maps absent diagnostics across empty-list, explicit-undefined, and missing parent paths', () => {
      const absentMessage = encode({
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
      });

      const emptyTuple = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['paths', 0],
          },
        ],
        { paths: [] },
        'faf.common.foreignNodes[0]'
      );
      expect(emptyTuple[0]?.constraint).toBe('configuration/empty-list');
      expect(emptyTuple[0]?.propertyPath).toBe(
        'faf.common.foreignNodes[0].paths'
      );

      const nonEmptyParent = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['locals', 0, 'name'],
          },
        ],
        { locals: [{ name: 'util' }] },
        'faf'
      );
      expect(nonEmptyParent[0]?.constraint).toBe(
        'configuration/explicit-undefined'
      );
      expect(nonEmptyParent[0]?.propertyPath).toBe('faf.locals[0].name');

      const missingFromPrimitiveParent = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['locals', 0],
          },
        ],
        1,
        'faf'
      );
      expect(missingFromPrimitiveParent[0]?.constraint).toBe(
        'configuration/missing-property'
      );

      const missingFromNullParent = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['faf', 'locals'],
          },
        ],
        { faf: null },
        ''
      );
      expect(missingFromNullParent[0]?.constraint).toBe(
        'configuration/missing-property'
      );

      const missingWithSymbolSegment = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: [Symbol('faf'), 'locals'],
          },
        ],
        { faf: {} },
        ''
      );
      expect(missingWithSymbolSegment[0]?.constraint).toBe(
        'configuration/missing-property'
      );

      const missingWithNumericKeyOnArray = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['0', 'name'],
          },
        ],
        ['src'],
        ''
      );
      expect(missingWithNumericKeyOnArray[0]?.constraint).toBe(
        'configuration/missing-property'
      );

      const absentNullEmptyList = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: encode({
              emptyList: null,
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
        'faf'
      );
      expect(absentNullEmptyList[0]?.constraint).toBe(
        'configuration/missing-property'
      );

      const arrayParent = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['items', 0],
          },
        ],
        { items: ['a'] },
        'faf'
      );
      expect(arrayParent[0]?.constraint).toBe('configuration/missing-property');

      const explicitInput: Record<string, unknown> = {};
      Object.defineProperty(explicitInput, 'roles', {
        enumerable: true,
        value: void 0,
      });
      const explicitUndefinedKey = translateConfigIssues(
        [
          {
            code: 'invalid_type',
            expected: 'string',
            message: absentMessage,
            path: ['roles'],
          },
        ],
        explicitInput,
        ''
      );
      expect(explicitUndefinedKey[0]?.constraint).toBe(
        'configuration/explicit-undefined'
      );
      expect(explicitUndefinedKey[0]?.propertyPath).toBe('roles');
    });
  });
});

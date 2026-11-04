import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { formFields } from './form-fields.schema.js';

describe('formFields', () => {
  it('rejects null, explicit undefined, and accepts a missing key', () => {
    const object = z.strictObject({
      roles: formFields.optionalProperty('roles'),
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
    const name = formFields.requiredText('name', 'CONFIG_2', 'CONFIG_3');
    expect(name.safeParse('util').success).toBe(true);
    expect(name.safeParse(undefined).success).toBe(false);
    expect(name.safeParse(null).success).toBe(false);
    expect(name.safeParse('').success).toBe(false);
  });

  it('rejects null, a non-string, and an empty string', () => {
    const text = formFields.textValue(
      'Path element cannot be null.',
      'Path element must be a string.',
      'Path element cannot be empty.',
      'CONFIG_2'
    );
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
        messageStyle: 'plain',
        normativeReference: 'CONFIG_2',
      })
    ).toContain('"kind":"keys"');
  });
});

import { describe, expect, it } from 'vitest';

import { getImmediateSubDomain } from './get-immediate-sub-domain.util.js';

describe('getImmediateSubDomain', () => {
  it('should return the immediate sub-domain path under the private category', () => {
    expect(
      getImmediateSubDomain(
        'src/rules/_rules@shared/_utils/_primitives/foo',
        'src/rules/_rules@shared/_utils'
      )
    ).toBe('src/rules/_rules@shared/_utils/_primitives');
  });

  it('should return private category path itself if no deeper segments exist', () => {
    expect(
      getImmediateSubDomain(
        'src/rules/_rules@shared/_utils',
        'src/rules/_rules@shared/_utils'
      )
    ).toBe('src/rules/_rules@shared/_utils');
  });

  it('should return empty string if path is outside the private category', () => {
    expect(
      getImmediateSubDomain('src/rules/other', 'src/rules/_rules@shared/_utils')
    ).toBe('');
  });
});

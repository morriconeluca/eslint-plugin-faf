import { describe, expect, it } from 'vitest';

import { createDirectoryBase } from './index.js';

describe('createDirectoryBase', () => {
  it('returns a blank directory classification rooted at the parent fragment', () => {
    expect(createDirectoryBase('src/button')).toEqual({
      domainKind: null,
      form: null,
      imposedRoleName: null,
      isMimeticContext: false,
      isPathFragment: false,
      isPrivateCategory: false,
      isSubFragment: false,
      isSubLayer: false,
      parentFragmentPath: 'src/button',
    });
  });
});

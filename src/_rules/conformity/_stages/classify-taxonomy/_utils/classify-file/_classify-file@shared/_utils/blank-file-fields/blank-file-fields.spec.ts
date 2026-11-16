import { describe, expect, it } from 'vitest';

import { blankFileFields } from './blank-file-fields.util.js';

describe('blankFileFields', () => {
  it('returns file fields with the supplied role and null domain data', () => {
    expect(
      blankFileFields(
        null,
        { kind: 'absent', roleName: null },
        null,
        null,
        null
      )
    ).toEqual({
      domainKind: null,
      form: null,
      fragmentInternalRank: null,
      imposedRoleName: null,
      isPathFragment: false,
      isPrivateCategory: false,
      isSubFragment: false,
      isSubLayer: false,
      nodeKind: null,
      parentFragmentPath: null,
      role: { kind: 'absent', roleName: null },
    });
  });
});

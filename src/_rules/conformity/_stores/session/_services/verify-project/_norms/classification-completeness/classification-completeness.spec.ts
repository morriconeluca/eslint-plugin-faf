import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyClassificationCompleteness } from './classification-completeness.norm.js';

const absentRole = { kind: 'absent' as const, roleName: null };

const qualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const item = (
  overrides: Partial<TItemClassification> &
    Pick<TItemClassification, 'entryKind' | 'itemId' | 'path'>
): TItemClassification => ({
  domainKind: null,
  fragmentInternalRank: null,
  imposedRoleName: null,
  nodeKind: null,
  relationalQualifications: qualifications,
  role: absentRole,
  ...overrides,
});

const taxonomyOf = (
  classifications: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(
    classifications.map((classification) => [
      classification.itemId,
      classification,
    ])
  ),
  byPath: new Map(
    classifications.map((classification) => [
      classification.path,
      classification,
    ])
  ),
  classifications,
});

const modelOf = (
  classifications: readonly TItemClassification[]
): TVerificationModel => ({
  ...verificationModel(),
  taxonomy: taxonomyOf(classifications),
});

describe('verifyClassificationCompleteness', () => {
  it('emits no outcomes when every directory and file has a unique classification', () => {
    const outcomes = verifyClassificationCompleteness(
      modelOf([
        item({
          domainKind: 'root-fragment',
          entryKind: 'directory',
          itemId: 0,
          path: 'src',
        }),
        item({
          entryKind: 'file',
          itemId: 1,
          nodeKind: 'root-node',
          path: 'src/main.ts',
        }),
      ])
    );
    expect(outcomes).toEqual([]);
  });

  it('reports an unclassifiable directory and a file that is neither Logical nor Foreign', () => {
    const outcomes = verifyClassificationCompleteness(
      modelOf([
        item({
          entryKind: 'directory',
          itemId: 1,
          path: 'src/blog',
        }),
        item({
          entryKind: 'file',
          itemId: 0,
          path: 'src/blog/page.tsx',
        }),
        item({
          entryKind: 'file',
          itemId: 2,
          nodeKind: 'unauthorized-logical-node',
          path: 'src/stray.ts',
        }),
      ])
    );
    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'classification/unclassifiable-directory',
      'classification/unclassifiable-file',
    ]);
    expect(outcomes).toEqual([
      {
        constraint: 'classification/unclassifiable-directory',
        element: 'src/blog',
        family: 'classification',
        message: "'src/blog' has no unique Logical Domain classification",
        normativeReference: 'FAF §6.9',
      },
      {
        constraint: 'classification/unclassifiable-file',
        element: 'src/blog/page.tsx',
        family: 'classification',
        message:
          "'src/blog/page.tsx' is neither a uniquely classified Logical Node nor a Foreign Node",
        normativeReference: 'FAF §6.9',
      },
    ]);
  });

  it('sorts by constraint before element, independently of model order', () => {
    const first = verifyClassificationCompleteness(
      modelOf([
        item({ entryKind: 'file', itemId: 2, path: 'a.ts' }),
        item({ entryKind: 'directory', itemId: 1, path: 'z' }),
        item({ entryKind: 'file', itemId: 3, path: 'm.ts' }),
      ])
    );
    const second = verifyClassificationCompleteness(
      modelOf([
        item({ entryKind: 'directory', itemId: 1, path: 'z' }),
        item({ entryKind: 'file', itemId: 3, path: 'm.ts' }),
        item({ entryKind: 'file', itemId: 2, path: 'a.ts' }),
      ])
    );
    expect(first.map((outcome) => outcome.element)).toEqual([
      'z',
      'a.ts',
      'm.ts',
    ]);
    expect(first).toEqual(second);
  });
});

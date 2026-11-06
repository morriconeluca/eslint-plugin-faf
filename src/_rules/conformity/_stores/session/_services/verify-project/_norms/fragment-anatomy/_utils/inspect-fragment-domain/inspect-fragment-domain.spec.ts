import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TRoleAttribution,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TFragmentInspection } from '../../_fragment-anatomy@shared/_types/fragment-anatomy.type.js';

import { inspectFragmentDomain } from './index.js';

const emptyQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const absentRole: TRoleAttribution = {
  kind: 'absent' as const,
  roleName: null,
};

const explicitRole = (roleName: string): TRoleAttribution => ({
  kind: 'explicit' as const,
  roleName,
});

const mockClassification = (
  itemId: number,
  path: string,
  nodeKind: null | TNodeKind,
  role: TRoleAttribution
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: 'component',
  itemId,
  nodeKind,
  path,
  relationalQualifications: emptyQualifications,
  role,
});

const fragmentClassification: TItemClassification = {
  domainKind: 'fragment',
  entryKind: 'directory',
  fragmentInternalRank: null,
  imposedRoleName: 'component',
  itemId: 0,
  nodeKind: null,
  path: 'src/_components/button',
  relationalQualifications: emptyQualifications,
  role: absentRole,
};

describe('inspectFragmentDomain', () => {
  it('returns no outcomes for a conformant Fragment domain', () => {
    const inspection: TFragmentInspection = {
      fragmentClassification,
      logicalChildren: [
        mockClassification(
          1,
          'src/_components/button/button.component.tsx',
          'master-node',
          explicitRole('component')
        ),
        mockClassification(
          2,
          'src/_components/button/index.ts',
          'access-node',
          absentRole
        ),
      ],
      masterRank: 16,
    };

    expect(inspectFragmentDomain(inspection)).toEqual([]);
  });

  it('detects missing access node, missing master node, and duplicate roles in sorted order', () => {
    const inspection: TFragmentInspection = {
      fragmentClassification,
      logicalChildren: [
        mockClassification(
          1,
          'src/_components/button/button.spec.ts',
          'sub-graph-node',
          explicitRole('spec')
        ),
        mockClassification(
          2,
          'src/_components/button/button.spec.tsx',
          'sub-graph-node',
          explicitRole('spec')
        ),
        mockClassification(
          3,
          'src/_components/button/button.hook.ts',
          'fragment-node',
          explicitRole('hook')
        ),
        mockClassification(
          4,
          'src/_components/button/button.hook.tsx',
          'fragment-node',
          explicitRole('hook')
        ),
      ],
      masterRank: 16,
    };

    const outcomes = inspectFragmentDomain(inspection);
    expect(outcomes.map((outcome) => outcome.constraint)).toEqual([
      'classification/missing-access-node',
      'classification/missing-master-node',
      'classification/duplicate-fragment-role',
      'classification/duplicate-fragment-role',
    ]);
    expect(outcomes).toHaveLength(4);
  });
});

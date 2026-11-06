import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TRoleAttribution,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TFragmentInspection } from '../../_fragment-anatomy@shared/_types/fragment-anatomy.type.js';

import { inspectFragmentNodes } from './index.js';

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
  role: TRoleAttribution,
  fragmentInternalRank: null | number = null
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank,
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

describe('inspectFragmentNodes', () => {
  it('returns no outcomes for valid nodes', () => {
    const inspection: TFragmentInspection = {
      fragmentClassification,
      logicalChildren: [
        mockClassification(
          1,
          'src/_components/button/button.component.tsx',
          'master-node',
          explicitRole('component'),
          16
        ),
        mockClassification(
          2,
          'src/_components/button/index.ts',
          'access-node',
          absentRole,
          17
        ),
        mockClassification(
          3,
          'src/_components/button/button.hook.ts',
          'fragment-node',
          explicitRole('hook'),
          15
        ),
      ],
      masterRank: 16,
    };

    expect(inspectFragmentNodes(inspection)).toEqual([]);
  });

  it('detects unauthorized files and rank violations', () => {
    const inspection: TFragmentInspection = {
      fragmentClassification,
      logicalChildren: [
        mockClassification(
          1,
          'src/_components/button/index.tsx',
          'unauthorized-logical-node',
          absentRole,
          null
        ),
        mockClassification(
          2,
          'src/_components/button/button.context.ts',
          'fragment-node',
          explicitRole('context'),
          16
        ),
      ],
      masterRank: 16,
    };

    expect(
      inspectFragmentNodes(inspection).map((outcome) => outcome.constraint)
    ).toEqual([
      'classification/fragment-node-anatomy',
      'classification/fragment-node-rank',
    ]);
  });

  it('skips rank violations when masterRank is null or imposedRoleName is null', () => {
    const withoutRank: TFragmentInspection = {
      fragmentClassification,
      logicalChildren: [
        mockClassification(
          1,
          'src/_components/button/button.context.ts',
          'fragment-node',
          explicitRole('context'),
          16
        ),
      ],
      masterRank: null,
    };

    const withoutImposedRole: TFragmentInspection = {
      fragmentClassification: {
        ...fragmentClassification,
        imposedRoleName: null,
      },
      logicalChildren: [
        mockClassification(
          1,
          'src/_components/button/button.context.ts',
          'fragment-node',
          explicitRole('context'),
          16
        ),
      ],
      masterRank: 16,
    };

    expect(inspectFragmentNodes(withoutRank)).toEqual([]);
    expect(inspectFragmentNodes(withoutImposedRole)).toEqual([]);
  });
});

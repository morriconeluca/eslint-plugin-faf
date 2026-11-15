import type {
  TInventory,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import {
  EXPOSED_NODE_KEYS,
  NEXT_TRAVERSAL_STATE,
  STATE_ORGANIZER,
} from './collect-layer-surface.constant.js';

export function collectLayerSurface(
  originPath: string,
  taxonomy: TTaxonomyModel,
  inventory: TInventory
): readonly string[] {
  const isExposedLayerNode = (path: string): boolean => {
    const prefix = originPath === '.' ? '' : `${originPath}/`;
    if (!path.startsWith(prefix)) {
      return false;
    }
    const segments = path.slice(prefix.length).split('/');
    let traversalState = STATE_ORGANIZER;
    let current = originPath === '.' ? '' : originPath;
    for (const segment of segments) {
      current = current === '' ? segment : `${current}/${segment}`;
      const classification = taxonomy.byPath.get(current);
      if (classification === undefined) {
        return false;
      }
      if (current === path) {
        const nodeKind = classification.nodeKind ?? 'absent';
        return EXPOSED_NODE_KEYS.has(`${traversalState}:${nodeKind}`);
      }
      const domainKind = String(classification.domainKind);
      const nextState = NEXT_TRAVERSAL_STATE[`${traversalState}:${domainKind}`];
      if (nextState === undefined) {
        return false;
      }
      traversalState = nextState;
    }
    return false;
  };

  const nodes: string[] = [];
  for (const item of inventory.items) {
    if (item.treeOrigin !== originPath) {
      continue;
    }
    if (isExposedLayerNode(item.path)) {
      nodes.push(item.path);
    }
  }
  nodes.sort(compareOrdinal);
  return nodes;
}

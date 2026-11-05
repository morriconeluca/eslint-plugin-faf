import type { TTaxonomyModel } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import {
  EXPOSED_NODE_KEYS,
  NEXT_ROLE,
  ROLE_ORGANIZER,
} from './is-exposed-layer-node.constant.js';

export function isExposedLayerNode(
  path: string,
  originPath: string,
  taxonomy: TTaxonomyModel
): boolean {
  const prefix = originPath === '.' ? '' : `${originPath}/`;
  if (!path.startsWith(prefix)) {
    return false;
  }
  const segments = path.slice(prefix.length).split('/');
  let role = ROLE_ORGANIZER;
  let current = originPath === '.' ? '' : originPath;
  for (const segment of segments) {
    current = current === '' ? segment : `${current}/${segment}`;
    const classification = taxonomy.byPath.get(current);
    if (classification === undefined) {
      return false;
    }
    if (current === path) {
      const nodeKind = classification.nodeKind ?? 'absent';
      return EXPOSED_NODE_KEYS.has(`${role}:${nodeKind}`);
    }
    const domainKind = String(classification.domainKind);
    const nextRole = NEXT_ROLE[`${role}:${domainKind}`];
    if (nextRole === undefined) {
      return false;
    }
    role = nextRole;
  }
  return false;
}

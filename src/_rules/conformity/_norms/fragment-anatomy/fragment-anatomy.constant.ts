import type { TNodeKind } from '../../_conformity@shared/_types/verification-model.type.js';

export const NODE_ACCESS: TNodeKind = 'access-node';

export const NODE_FRAGMENT: TNodeKind = 'fragment-node';

export const NODE_MASTER: TNodeKind = 'master-node';

export const NODE_SUB_GRAPH: TNodeKind = 'sub-graph-node';

export const ADMITTED_NODE_KINDS = new Set<null | TNodeKind>([
  NODE_ACCESS,
  NODE_FRAGMENT,
  NODE_MASTER,
  NODE_SUB_GRAPH,
]);

export const FRAGMENT_OR_SUB_GRAPH_KINDS = new Set<null | TNodeKind>([
  NODE_FRAGMENT,
  NODE_MASTER,
  NODE_SUB_GRAPH,
]);

export const MASTER_CANDIDATE_KINDS = new Set<null | TNodeKind>([
  NODE_FRAGMENT,
  NODE_MASTER,
]);

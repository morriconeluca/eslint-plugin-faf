import type {
  TContainmentMatrix,
  TDirectChildType,
} from '../_containment-matrix@shared/_types/containment-matrix.type.js';

const ACCESS_NODE: TDirectChildType = 'access-node';
const CATEGORY: TDirectChildType = 'category';
const CATEGORY_NODE: TDirectChildType = 'category-node';
const FOREIGN_DOMAIN: TDirectChildType = 'foreign-domain';
const FOREIGN_NODE: TDirectChildType = 'foreign-node';
const FRACTAL_BRANCH: TDirectChildType = 'fractal-branch';
const FRAGMENT: TDirectChildType = 'fragment';
const FRAGMENT_NODE: TDirectChildType = 'fragment-node';
const LAYER: TDirectChildType = 'layer';
const PATH_SUB_CATEGORY: TDirectChildType = 'path-sub-category';
const PRIVATE_CATEGORY: TDirectChildType = 'private-category';
const ROOT_FRAGMENT: TDirectChildType = 'root-fragment';
const ROOT_NODE: TDirectChildType = 'root-node';
const SUB_CATEGORY: TDirectChildType = 'sub-category';
const SUB_GRAPH_NODE: TDirectChildType = 'sub-graph-node';

export const CONTAINMENT_MATRIX: TContainmentMatrix = {
  category: [
    CATEGORY_NODE,
    FOREIGN_DOMAIN,
    FOREIGN_NODE,
    FRACTAL_BRANCH,
    FRAGMENT,
    SUB_CATEGORY,
  ],
  'foreign-domain': [FOREIGN_DOMAIN, FOREIGN_NODE],
  'fractal-branch': [CATEGORY, FOREIGN_DOMAIN, FOREIGN_NODE, LAYER],
  fragment: [
    ACCESS_NODE,
    FOREIGN_DOMAIN,
    FOREIGN_NODE,
    FRACTAL_BRANCH,
    FRAGMENT_NODE,
    PRIVATE_CATEGORY,
    SUB_GRAPH_NODE,
  ],
  layer: [CATEGORY, FOREIGN_DOMAIN, FOREIGN_NODE, FRACTAL_BRANCH, LAYER],
  'mimetic-parent-category': [
    FOREIGN_DOMAIN,
    FOREIGN_NODE,
    FRACTAL_BRANCH,
    FRAGMENT,
    PATH_SUB_CATEGORY,
  ],
  'root-fragment': [
    FOREIGN_DOMAIN,
    FOREIGN_NODE,
    FRACTAL_BRANCH,
    PRIVATE_CATEGORY,
    ROOT_FRAGMENT,
    ROOT_NODE,
  ],
  'root-layer': [CATEGORY, FOREIGN_DOMAIN, FOREIGN_NODE, FRACTAL_BRANCH, LAYER],
} as const;

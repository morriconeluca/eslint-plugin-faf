/**
 * Structural item types evaluated as direct children by containment resolution.
 */
export type TResolvedChildType =
  | 'access-node'
  | 'category'
  | 'category-node'
  | 'foreign-domain'
  | 'foreign-node'
  | 'fractal-branch'
  | 'fragment'
  | 'fragment-node'
  | 'layer'
  | 'path-sub-category'
  | 'private-category'
  | 'root-fragment'
  | 'root-layer'
  | 'root-node'
  | 'sub-category'
  | 'sub-graph-node'
  | 'unauthorized-logical-node';

/**
 * Classification domain types admitted as parents by containment resolution.
 */
export type TResolvedParentType =
  | 'category'
  | 'foreign-domain'
  | 'fractal-branch'
  | 'fragment'
  | 'layer'
  | 'mimetic-parent-category'
  | 'root-fragment'
  | 'root-layer';

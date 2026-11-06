/**
 * Matrix table mapping each parent domain type to its admitted direct child types.
 */
export type TContainmentMatrix = Readonly<
  Record<TParentDomainType, readonly TDirectChildType[]>
>;

/**
 * Closed structural item types evaluated as direct children in the containment matrix.
 */
export type TDirectChildType =
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
 * Closed classification domain types admitted as parents by the containment matrix.
 */
export type TParentDomainType =
  | 'category'
  | 'foreign-domain'
  | 'fractal-branch'
  | 'fragment'
  | 'layer'
  | 'mimetic-parent-category'
  | 'root-fragment'
  | 'root-layer';

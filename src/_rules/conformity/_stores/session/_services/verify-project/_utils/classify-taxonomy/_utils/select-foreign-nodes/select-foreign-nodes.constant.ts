import type { TForeignSelection } from './select-foreign-nodes.type.js';

export const EMPTY_FOREIGN_SELECTION: TForeignSelection = {
  foreignDomainItemIds: new Set<number>(),
  foreignDomainPaths: new Set<string>(),
  foreignNodeItemIds: new Set<number>(),
  foreignNodePaths: new Set<string>(),
};

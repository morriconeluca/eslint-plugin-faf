import type { TSourceLocation } from '../../../../../_domain/_types/outcome.type.js';

/**
 * Pure mapping function resolving a character offset to line and column coordinates.
 */
export type TSourceLocator = (offset: number) => TSourceLocation;

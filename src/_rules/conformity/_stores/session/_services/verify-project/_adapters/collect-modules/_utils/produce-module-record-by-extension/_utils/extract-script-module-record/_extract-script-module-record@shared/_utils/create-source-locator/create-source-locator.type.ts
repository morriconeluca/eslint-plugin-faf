import type { TSourceLocation } from '../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Pure mapping function resolving a character offset to line and column coordinates.
 */
export type TSourceLocator = (offset: number) => TSourceLocation;

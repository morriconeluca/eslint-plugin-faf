import type { TSourceLocation } from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

/**
 * Pure mapping function resolving a character offset to line and column coordinates.
 */
export type TSourceLocator = (offset: number) => TSourceLocation;

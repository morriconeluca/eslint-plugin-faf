import type { TEffectivePathAlias } from '../../_types/declarations.type.js';

/**
 * Candidate alias match with extracted suffix prior to target path resolution.
 */
export type TCandidateMatch = {
  /**
   * The effective path alias definition matching the import specifier.
   */
  readonly alias: TEffectivePathAlias;

  /**
   * Subpath portion succeeding the alias prefix boundary, or empty string for exact match.
   */
  readonly suffix: string;
};

/**
 * Result of matching an import specifier against configured path aliases.
 */
export type TMatchedPathAlias = {
  /**
   * The effective path alias definition matching the import specifier.
   */
  readonly alias: TEffectivePathAlias;

  /**
   * Subpath portion succeeding the alias prefix boundary, or empty string for exact match.
   */
  readonly suffix: string;

  /**
   * Candidate target paths with the subpath suffix appended to each target base.
   */
  readonly targets: readonly string[];
};

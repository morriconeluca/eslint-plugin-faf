import type { TResult } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TEffectivePathAlias } from '../../_verify-project@shared/_types/_primitives/declarations.type.js';

/**
 * Input arguments for acquiring effective path aliases from configuration sources.
 */
export type TAcquirePathAliasesInput = {
  /**
   * Direct path alias map from fafconfig.ts common configuration.
   */
  readonly commonAliases?: Readonly<Record<string, string>>;

  /**
   * Parsed payload of package.json residing adjacent to fafconfig.ts.
   */
  readonly packageJson?: Record<string, unknown>;
};

/**
 * Computation result yielding acquired effective path aliases or diagnostic outcomes.
 */
export type TAcquirePathAliasesResult = TResult<readonly TEffectivePathAlias[]>;

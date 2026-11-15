import type { TResult } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TEffectivePathAlias } from '../../../../_verify-project@shared/_types/verification-model.type.js';

/**
 * Input arguments for acquiring effective path aliases from configuration sources.
 */
export type TAcquirePathAliasesInput = {
  /**
   * Direct path alias map from faf.config.ts common configuration.
   */
  readonly commonAliases?: Readonly<Record<string, string>>;

  /**
   * Parsed payload of package.json residing adjacent to faf.config.ts.
   */
  readonly packageJson?: Record<string, unknown>;
};

/**
 * Computation result yielding acquired effective path aliases or diagnostic outcomes.
 */
export type TAcquirePathAliasesResult = TResult<readonly TEffectivePathAlias[]>;

/**
 * Diagnostic outcome resulting from dependency graph cycles or transitive returns.
 */
export type TAcyclicityOutcome = {
  /**
   * Specific rule identifier formatted as acyclicity/constraint-name.
   */
  readonly constraint: `acyclicity/${string}`;

  /**
   * Ordered sequence of file paths demonstrating the circular dependency chain.
   */
  readonly cycleChain: readonly string[];

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Discriminant family tag for acyclicity diagnostics.
   */
  readonly family: 'acyclicity';

  /**
   * Human-readable diagnostic description in English explaining the defect.
   */
  readonly message: string;

  /**
   * Specification clause reference such as §5, §6.6.2, or §7.2.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates of the statement completing the circular dependency.
   */
  readonly position?: TSourceLocation;
};

/**
 * Diagnostic outcome resulting from unclassifiable elements or taxonomy conflicts.
 */
export type TClassificationOutcome = {
  /**
   * Specific rule identifier formatted as classification/constraint-name.
   */
  readonly constraint: `classification/${string}`;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Discriminant family tag for classification diagnostics.
   */
  readonly family: 'classification';

  /**
   * Human-readable diagnostic description in English explaining the defect.
   */
  readonly message: string;

  /**
   * Specification clause reference such as §6.9 or §6.1.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates where the classification issue originated.
   */
  readonly position?: TSourceLocation;
};

/**
 * Diagnostic outcome resulting from invalid fafconfig declarations or formatting.
 */
export type TConfigOutcome = {
  /**
   * Specific rule identifier formatted as configuration/constraint-name.
   */
  readonly constraint: `configuration/${string}`;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Discriminant family tag for configuration diagnostics.
   */
  readonly family: 'configuration';

  /**
   * Human-readable diagnostic description in English explaining the defect.
   */
  readonly message: string;

  /**
   * Specification clause reference such as CONFIG_5 or CONFIG_12.
   */
  readonly normativeReference: string;

  /**
   * Exact location in the configuration file where the diagnostic applies.
   */
  readonly position?: TSourceLocation;

  /**
   * Object access path locating the faulty setting within the configuration object.
   */
  readonly propertyPath: string;
};

/**
 * Diagnostic outcome resulting from illegal dependency imports across boundaries.
 */
export type TDependencyOutcome = {
  /**
   * Specific rule identifier formatted as dependency/constraint-name.
   */
  readonly constraint: `dependency/${string}`;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Discriminant family tag for dependency diagnostics.
   */
  readonly family: 'dependency';

  /**
   * Source file POSIX path originating the unauthorized import.
   */
  readonly from: string;

  /**
   * Zero-based index of the import statement within the source module record.
   */
  readonly importIndex: number;

  /**
   * Human-readable diagnostic description in English explaining the defect.
   */
  readonly message: string;

  /**
   * Specification clause reference such as §5, §6.1.1, or §7.2.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates of the unauthorized import statement.
   */
  readonly position?: TSourceLocation;

  /**
   * Verbatim module specifier string written in the source code.
   */
  readonly specifier?: string;

  /**
   * Target destination resolved path or external package identifier.
   */
  readonly to: string;
};

/**
 * Discriminated union of all structured diagnostic outcomes across families.
 */
export type TOutcome =
  | TAcyclicityOutcome
  | TClassificationOutcome
  | TConfigOutcome
  | TDependencyOutcome
  | TSymbolOutcome
  | TUnverifiedOutcome;

/**
 * Outcome family categories matching rule message identifiers.
 */
export type TOutcomeFamily =
  | 'acyclicity'
  | 'classification'
  | 'configuration'
  | 'dependency'
  | 'symbol'
  | 'unverified';

/**
 * Discriminated computation result encapsulating either success value or outcomes.
 */
export type TResult<TValue> =
  | {
      /**
       * Failure indicator flag set to false.
       */
      readonly ok: false;

      /**
       * List of diagnostic outcomes explaining the verification failures.
       */
      readonly outcomes: readonly TOutcome[];
    }
  | {
      /**
       * Success indicator flag set to true.
       */
      readonly ok: true;

      /**
       * Successfully produced computation payload value.
       */
      readonly value: TValue;
    };

/**
 * Source code location indicating line and column coordinates.
 */
export type TSourceLocation = {
  /**
   * Column index within the source text starting from index 1.
   */
  readonly column: number;

  /**
   * Line index within the source text starting from index 1.
   */
  readonly line: number;
};

/**
 * Diagnostic outcome resulting from symbol uniqueness or export law violations.
 */
export type TSymbolOutcome = {
  /**
   * Specific rule identifier formatted as symbol/constraint-name.
   */
  readonly constraint: `symbol/${string}`;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Discriminant family tag for symbol diagnostics.
   */
  readonly family: 'symbol';

  /**
   * Human-readable diagnostic description in English explaining the defect.
   */
  readonly message: string;

  /**
   * Specification clause reference such as §4, §5, or §6.1.1.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates where the invalid symbol is declared.
   */
  readonly position?: TSourceLocation;

  /**
   * Total quantity of root-scope symbols discovered in the logical node.
   */
  readonly symbolCount?: number;

  /**
   * Identifier of the symbol implicated in the violation.
   */
  readonly symbolName?: string;
};

/**
 * Diagnostic outcome indicating an incomplete check due to unresolvable inputs.
 */
export type TUnverifiedOutcome = {
  /**
   * Specific rule identifier formatted as unverified/constraint-name.
   */
  readonly constraint: `unverified/${string}`;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Discriminant family tag for unverified diagnostics.
   */
  readonly family: 'unverified';

  /**
   * Human-readable diagnostic description in English explaining the defect.
   */
  readonly message: string;

  /**
   * Specification clause reference such as §4 or CONFIG_12.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates where the unresolvable reference occurs.
   */
  readonly position?: TSourceLocation;

  /**
   * Technical justification why the verification check could not be completed.
   */
  readonly reason: string;
};

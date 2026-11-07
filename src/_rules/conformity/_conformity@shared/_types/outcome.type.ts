/**
 * Closed constraint union for acyclicity diagnostic outcomes.
 */
export type TAcyclicityConstraint =
  | 'acyclicity/dependency-cycle'
  | 'acyclicity/inter-tree-cycle';

/**
 * Diagnostic outcome resulting from dependency graph cycles or transitive returns.
 */
export type TAcyclicityOutcome = {
  /**
   * Specific rule identifier formatted as acyclicity/constraint-name.
   */
  readonly constraint: TAcyclicityConstraint;

  /**
   * Ordered sequence of segments demonstrating the circular dependency cycle.
   */
  readonly cycle: readonly (readonly string[])[];

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
   * Specification clause reference such as FAF §5 or FAF §7.2.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates of the statement completing the circular dependency.
   */
  readonly position?: TSourceLocation;
};

/**
 * Immutable catalog entry describing a single architectural diagnostic constraint.
 */
export type TCatalogEntry = {
  /**
   * Diagnostic outcome family grouping.
   */
  readonly family: TOutcomeFamily;

  /**
   * Message formatting structure.
   */
  readonly form: TOutcomeForm;

  /**
   * Normative framework or architectural decision reference.
   */
  readonly normativeReference: string;

  /**
   * Violating predicate describing the defect in domain terms.
   */
  readonly predicate: string;
};

/**
 * Closed constraint union for classification diagnostic outcomes.
 */
export type TClassificationConstraint =
  | 'classification/category-role'
  | 'classification/containment-matrix'
  | 'classification/duplicate-fragment-role'
  | 'classification/exclusive-forms'
  | 'classification/fragment-node-anatomy'
  | 'classification/fragment-node-rank'
  | 'classification/horizontal-hierarchy-members'
  | 'classification/horizontal-hierarchy-overlap'
  | 'classification/missing-access-node'
  | 'classification/missing-master-node'
  | 'classification/nomenclature'
  | 'classification/unclassifiable-directory'
  | 'classification/unclassifiable-file';

/**
 * Diagnostic outcome resulting from unclassifiable elements or taxonomy conflicts.
 */
export type TClassificationOutcome = {
  /**
   * Specific rule identifier formatted as classification/constraint-name.
   */
  readonly constraint: TClassificationConstraint;

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
   * Specification clause reference such as FAF §6.9 or FAF §6.1.1.
   */
  readonly normativeReference: string;

  /**
   * Source coordinates where the classification issue originated.
   */
  readonly position?: TSourceLocation;
};

/**
 * Closed constraint union for configuration diagnostic outcomes.
 */
export type TConfigConstraint =
  | 'configuration/commonjs-package-type'
  | 'configuration/config-load-failure'
  | 'configuration/conflicting-origin-kind'
  | 'configuration/contradictory-root-foreign'
  | 'configuration/duplicate-alias-source'
  | 'configuration/duplicate-category'
  | 'configuration/duplicate-element'
  | 'configuration/duplicate-implicit-extension'
  | 'configuration/duplicate-mimetic-path'
  | 'configuration/duplicate-origin'
  | 'configuration/duplicate-role-name'
  | 'configuration/empty-list'
  | 'configuration/empty-string'
  | 'configuration/empty-tier'
  | 'configuration/expected-directory'
  | 'configuration/expected-file'
  | 'configuration/explicit-undefined'
  | 'configuration/external-dependency-to-alias'
  | 'configuration/external-dependency-to-inside-tree'
  | 'configuration/external-dependency-to-library'
  | 'configuration/implicit-extension-category-node-mismatch'
  | 'configuration/implicit-extension-role-name-prefix'
  | 'configuration/incompatible-foreign-origin'
  | 'configuration/incompatible-mimetic-designation'
  | 'configuration/incompatible-root-in-foreign-domain'
  | 'configuration/invalid-action-name'
  | 'configuration/invalid-alias-key'
  | 'configuration/invalid-alias-source'
  | 'configuration/invalid-default-export-function'
  | 'configuration/invalid-default-export-promise'
  | 'configuration/invalid-external-dependency-source'
  | 'configuration/invalid-file-name'
  | 'configuration/invalid-foreign-pattern'
  | 'configuration/invalid-implicit-extension'
  | 'configuration/invalid-literal-path'
  | 'configuration/invalid-origin'
  | 'configuration/invalid-package-json'
  | 'configuration/invalid-public-root-node'
  | 'configuration/invalid-root-dependency-from'
  | 'configuration/invalid-root-dependency-to'
  | 'configuration/invalid-type'
  | 'configuration/missing-config-file'
  | 'configuration/missing-default-export'
  | 'configuration/missing-origin'
  | 'configuration/missing-property'
  | 'configuration/missing-roles'
  | 'configuration/nested-root-fragment-not-direct-child'
  | 'configuration/non-existent-path'
  | 'configuration/null-forbidden'
  | 'configuration/origin-contained-in-other-tree'
  | 'configuration/origin-designated-foreign-domain'
  | 'configuration/overlapping-origins'
  | 'configuration/public-root-node-not-enumerated'
  | 'configuration/public-root-nodes-in-root-layer-tree'
  | 'configuration/reference-outside-local-scope'
  | 'configuration/reference-outside-trees'
  | 'configuration/role-name-conflict'
  | 'configuration/root-dependency-different-tree'
  | 'configuration/root-dependency-same-fragment'
  | 'configuration/root-node-not-direct-child'
  | 'configuration/scope-mismatch'
  | 'configuration/tree-dependency-from-outside-scope'
  | 'configuration/tree-dependency-not-tree-origin'
  | 'configuration/tree-dependency-self'
  | 'configuration/unclonable-config-value'
  | 'configuration/undeclared-sub-root-fragment'
  | 'configuration/unenumerated-root-file'
  | 'configuration/unknown-property'
  | 'configuration/unresolvable-alias-base'
  | 'configuration/unresolved-relative-import'
  | 'configuration/unsupported-typescript-syntax';

/**
 * Observed facts provided when constructing configuration diagnostic outcomes.
 */
export type TConfigFacts = {
  /**
   * Optional observed defect detail expanding the predicate.
   */
  readonly detail?: null | string;

  /**
   * Optional custom element path defaulting to propertyPath when omitted.
   */
  readonly element?: string;

  /**
   * Optional source code coordinates of the diagnostic location.
   */
  readonly position?: TSourceLocation;

  /**
   * Configuration property path locating the setting within fafconfig.ts.
   */
  readonly propertyPath: string;
};

/**
 * Diagnostic outcome resulting from invalid fafconfig declarations or formatting.
 */
export type TConfigOutcome = {
  /**
   * Specific rule identifier formatted as configuration/constraint-name.
   */
  readonly constraint: TConfigConstraint;

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
   * Specification clause reference such as FAF §6.3.1, D-06, or D-14.
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
 * Closed union of all diagnostic constraint codes across families.
 */
export type TConstraint =
  | TAcyclicityConstraint
  | TClassificationConstraint
  | TConfigConstraint
  | TDependencyConstraint
  | TSymbolConstraint
  | TUnverifiedConstraint;

/**
 * Observed facts provided when constructing graph cycle diagnostic outcomes.
 */
export type TCycleFacts = {
  /**
   * Ordered sequence of path segments demonstrating circular dependency loops.
   */
  readonly cycle: readonly (readonly string[])[];

  /**
   * Codebase path relative to configuration root identifying the cyclic element.
   */
  readonly element: string;

  /**
   * Optional source code coordinates of the statement completing the cycle.
   */
  readonly position?: TSourceLocation;
};

/**
 * Closed constraint union for dependency diagnostic outcomes.
 */
export type TDependencyConstraint =
  | 'dependency/access-node-sources'
  | 'dependency/external-dependencies'
  | 'dependency/foreign-node-isolation'
  | 'dependency/fractal-branch-unidirectionality'
  | 'dependency/fractal-branch-visibility'
  | 'dependency/fragment-encapsulation'
  | 'dependency/path-alias-anchoring'
  | 'dependency/peer-separation'
  | 'dependency/private-category-unidirectionality'
  | 'dependency/private-category-visibility'
  | 'dependency/re-entry-prohibition'
  | 'dependency/root-node-discipline'
  | 'dependency/sub-graph-node-isolation'
  | 'dependency/tree-authorization'
  | 'dependency/tree-opacity';

/**
 * Diagnostic outcome resulting from illegal dependency imports across boundaries.
 */
export type TDependencyOutcome = {
  /**
   * Real chain of dependency paths demonstrating transitively reached targets.
   */
  readonly chain?: readonly string[];

  /**
   * Specific rule identifier formatted as dependency/constraint-name.
   */
  readonly constraint: TDependencyConstraint;

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
   * Specification clause reference such as FAF §5, FAF §6.1.1, or FAF §7.2.
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
 * Observed facts provided when constructing dependency edge diagnostic outcomes.
 */
export type TEdgeFacts = {
  /**
   * Optional element identifier defaulting to the originating file path.
   */
  readonly element?: string;

  /**
   * Source file POSIX path originating the unauthorized import.
   */
  readonly from: string;

  /**
   * Zero-based index of the import statement within the source module record.
   */
  readonly importIndex: number;

  /**
   * Optional source coordinates of the unauthorized import statement.
   */
  readonly position?: TSourceLocation;

  /**
   * Verbatim module specifier string written in the source code.
   */
  readonly specifier: string;

  /**
   * Target destination resolved path or external package identifier.
   */
  readonly to: string;
};

/**
 * Dependency constraints supporting only edge facts with explicit specifier.
 */
export type TEdgeOnlyDependencyConstraint = Exclude<
  TDependencyConstraint,
  TEdgeOrPathDependencyConstraint | TPathOnlyDependencyConstraint
>;

/**
 * Dependency constraints supporting both single direct edges and transitive paths.
 */
export type TEdgeOrPathDependencyConstraint =
  | 'dependency/fractal-branch-unidirectionality'
  | 'dependency/tree-authorization';

/**
 * Observed facts provided when constructing element-oriented diagnostic outcomes.
 */
export type TElementFacts = {
  /**
   * Optional observed defect detail expanding the predicate.
   */
  readonly detail?: null | string;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Optional source coordinates where the diagnostic applies.
   */
  readonly position?: TSourceLocation;
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
 * Combined facts union acceptable across all diagnostic constraint forms.
 */
export type TOutcomeFacts =
  | TConfigFacts
  | TCycleFacts
  | TEdgeFacts
  | TElementFacts
  | TPathFacts
  | TSymbolFacts
  | TUnverifiedFacts;

/**
 * Conditional type selecting the mandatory facts required by a given constraint.
 */
export type TOutcomeFactsFor<K extends TConstraint> =
  K extends TAcyclicityConstraint
    ? TCycleFacts
    : K extends TPathOnlyDependencyConstraint
      ? TPathFacts
      : K extends TEdgeOrPathDependencyConstraint
        ? TEdgeFacts | TPathFacts
        : K extends TEdgeOnlyDependencyConstraint
          ? TEdgeFacts
          : K extends TConfigConstraint
            ? TConfigFacts
            : K extends TUnverifiedConstraint
              ? TUnverifiedFacts
              : K extends TSymbolConstraint
                ? TSymbolFacts
                : K extends TClassificationConstraint
                  ? TElementFacts
                  : never;

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
 * Conditional type selecting the exact outcome shape produced by a given constraint.
 */
export type TOutcomeFor<K extends TConstraint> = K extends TAcyclicityConstraint
  ? TAcyclicityOutcome
  : K extends TClassificationConstraint
    ? TClassificationOutcome
    : K extends TConfigConstraint
      ? TConfigOutcome
      : K extends TDependencyConstraint
        ? TDependencyOutcome
        : K extends TSymbolConstraint
          ? TSymbolOutcome
          : K extends TUnverifiedConstraint
            ? TUnverifiedOutcome
            : never;

/**
 * Message formatting structure category for diagnostic constraints.
 */
export type TOutcomeForm =
  | 'cycle'
  | 'edge'
  | 'edge-or-path'
  | 'element'
  | 'path';

/**
 * Observed facts provided when constructing transitive path diagnostic outcomes.
 */
export type TPathFacts = {
  /**
   * Real chain of dependency paths demonstrating transitively reached targets.
   */
  readonly chain: readonly string[];

  /**
   * Optional element identifier defaulting to the originating file path.
   */
  readonly element?: string;

  /**
   * Source file POSIX path originating the unauthorized reachability chain.
   */
  readonly from: string;

  /**
   * Zero-based index of the originating import statement.
   */
  readonly importIndex: number;

  /**
   * Optional source coordinates of the unauthorized import statement.
   */
  readonly position?: TSourceLocation;

  /**
   * Optional verbatim module specifier string written in the source code.
   */
  readonly specifier?: string;

  /**
   * Target destination resolved path or external package identifier.
   */
  readonly to: string;
};

/**
 * Dependency constraints strictly requiring multi-hop path facts.
 */
export type TPathOnlyDependencyConstraint = 'dependency/re-entry-prohibition';

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
 * Closed constraint union for symbol diagnostic outcomes.
 */
export type TSymbolConstraint =
  | 'symbol/access-node-master-export'
  | 'symbol/access-node-own-symbols'
  | 'symbol/master-symbol'
  | 'symbol/re-export-prohibition'
  | 'symbol/symbol-uniqueness';

/**
 * Observed facts provided when constructing symbol diagnostic outcomes.
 */
export type TSymbolFacts = {
  /**
   * Optional observed defect detail expanding the predicate.
   */
  readonly detail?: null | string;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Optional source coordinates where the symbol issue occurs.
   */
  readonly position?: TSourceLocation;

  /**
   * Optional quantity of root-scope symbols discovered in the logical node.
   */
  readonly symbolCount?: number;

  /**
   * Optional identifier of the symbol implicated in the violation.
   */
  readonly symbolName?: string;
};

/**
 * Diagnostic outcome resulting from symbol uniqueness or export law violations.
 */
export type TSymbolOutcome = {
  /**
   * Specific rule identifier formatted as symbol/constraint-name.
   */
  readonly constraint: TSymbolConstraint;

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
   * Specification clause reference such as FAF §4, FAF §5, or FAF §6.1.1.
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
 * Closed constraint union for unverified diagnostic outcomes.
 */
export type TUnverifiedConstraint =
  | 'unverified/config-loading-timeout'
  | 'unverified/cyclic-root-authorization'
  | 'unverified/cyclic-tree-authorization'
  | 'unverified/non-literal-dynamic-import'
  | 'unverified/symbolic-link'
  | 'unverified/unreadable-entry'
  | 'unverified/unreadable-external-file'
  | 'unverified/unreadable-origin'
  | 'unverified/unresolved-import'
  | 'unverified/unsupported-syntax';

/**
 * Observed facts provided when constructing unverified diagnostic outcomes.
 */
export type TUnverifiedFacts = {
  /**
   * Optional observed defect detail expanding the predicate.
   */
  readonly detail?: null | string;

  /**
   * Codebase path relative to configuration root identifying the affected item.
   */
  readonly element: string;

  /**
   * Optional source coordinates where the incomplete check occurs.
   */
  readonly position?: TSourceLocation;

  /**
   * Technical justification why the verification check could not be completed.
   */
  readonly reason: string;
};

/**
 * Diagnostic outcome indicating an incomplete check due to unresolvable inputs.
 */
export type TUnverifiedOutcome = {
  /**
   * Specific rule identifier formatted as unverified/constraint-name.
   */
  readonly constraint: TUnverifiedConstraint;

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
   * Specification clause reference such as D-03, D-06, or D-09.
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

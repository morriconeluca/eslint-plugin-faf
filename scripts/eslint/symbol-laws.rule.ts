import type { Rule } from 'eslint';

const TYPE_VARIABLE_DECLARATION = 'VariableDeclaration';
const TYPE_FUNCTION_DECLARATION = 'FunctionDeclaration';
const TYPE_CLASS_DECLARATION = 'ClassDeclaration';
const TYPE_ENUM_DECLARATION = 'TSEnumDeclaration';
const TYPE_TYPE_ALIAS_DECLARATION = 'TSTypeAliasDeclaration';
const TYPE_INTERFACE_DECLARATION = 'TSInterfaceDeclaration';
const TYPE_MODULE_DECLARATION = 'TSModuleDeclaration';
const TYPE_DECLARE_FUNCTION = 'TSDeclareFunction';
const TYPE_EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration';
const TYPE_EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration';
const TYPE_EXPORT_ALL_DECLARATION = 'ExportAllDeclaration';
const TYPE_IMPORT_DECLARATION = 'ImportDeclaration';
const TYPE_IDENTIFIER = 'Identifier';
const TYPE_ASSIGNMENT_PATTERN = 'AssignmentPattern';
const TYPE_REST_ELEMENT = 'RestElement';
const TYPE_ARRAY_PATTERN = 'ArrayPattern';
const TYPE_OBJECT_PATTERN = 'ObjectPattern';
const TYPE_PROPERTY = 'Property';

const SCRIPT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const TYPE_OR_CLASS_DECLARATION_TYPES = new Set([
  TYPE_CLASS_DECLARATION,
  TYPE_ENUM_DECLARATION,
  TYPE_INTERFACE_DECLARATION,
  TYPE_MODULE_DECLARATION,
  TYPE_TYPE_ALIAS_DECLARATION,
]);

const DEFAULT_LOCATION = {
  end: { column: 0, line: 1 },
  start: { column: 0, line: 1 },
} as const;

type TAnalysisAccumulator = {
  readonly accessNodeInvalidSources: TSourceLocation[];
  readonly accessNodeInvalidStatements: TSourceLocation[];
  readonly defaultExportPending: {
    readonly loc: TSourceLocation;
    readonly name: string;
  }[];
  readonly definedSymbols: TDefinedSymbol[];
  readonly fallbackLoc: TSourceLocation;
  readonly importedBindings: Map<string, TImportedBinding>;
  readonly knownFunctions: Set<string>;
  readonly namedExportsPending: {
    readonly loc: TSourceLocation;
    readonly name: string;
  }[];
  readonly reExportedSources: string[];
  readonly reExportViolations: TReExportRecord[];
  readonly subGraphRoles: ReadonlySet<string>;
};

type TAnalysisResult = {
  readonly accessNodeInvalidSources: readonly TSourceLocation[];
  readonly accessNodeInvalidStatements: readonly TSourceLocation[];
  readonly definedSymbols: readonly TDefinedSymbol[];
  readonly exportedCount: number;
  readonly reExportedSources: readonly string[];
  readonly reExportViolations: readonly TReExportRecord[];
};

type TDefinedSymbol = {
  readonly isExported: boolean;
  readonly loc: TSourceLocation;
  readonly name?: string;
};

type TFileClassification = {
  readonly fragmentRole?: string;
  readonly hasAllowMultiple: boolean;
  readonly isAccessNode: boolean;
  readonly isMain: boolean;
  readonly isMaster: boolean;
  readonly isSubGraph: boolean;
  readonly name?: string;
  readonly parentDirectory: string;
  readonly role?: string;
};

type TImportedBinding = {
  readonly loc: TSourceLocation;
  readonly name: string;
  readonly source: string;
};

type TPosition = {
  readonly column: number;
  readonly line: number;
};

type TReExportRecord = {
  readonly loc: TSourceLocation;
  readonly source?: string;
};

type TRuleNormalizedOptions = {
  readonly allowMultipleSymbols: ReadonlySet<string>;
  readonly categories: ReadonlyMap<string, string>;
  readonly roles: ReadonlySet<string>;
  readonly subGraphRoles: ReadonlySet<string>;
};

type TSourceLocation = NonNullable<Rule.Node['loc']>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getStringProperty = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const getArrayProperty = (
  record: Record<string, unknown>,
  key: string
): readonly unknown[] | undefined => {
  const value = record[key];
  return Array.isArray(value) ? value : undefined;
};

const extractArrayPatternNames = (
  pattern: Record<string, unknown>
): readonly string[] => {
  const elements = getArrayProperty(pattern, 'elements');
  if (elements === undefined) {
    return [];
  }
  const names: string[] = [];
  for (const element of elements) {
    if (element !== null && element !== undefined) {
      names.push(...extractPatternNames(element));
    }
  }
  return names;
};

const extractPropertyTarget = (property: Record<string, unknown>): unknown => {
  const propertyType = property['type'];
  if (propertyType === TYPE_REST_ELEMENT) {
    return property['argument'];
  }
  if (propertyType === TYPE_PROPERTY) {
    return property['value'];
  }
  return undefined;
};

const extractObjectPatternNames = (
  pattern: Record<string, unknown>
): readonly string[] => {
  const properties = getArrayProperty(pattern, 'properties');
  if (properties === undefined) {
    return [];
  }
  const names: string[] = [];
  for (const property of properties) {
    if (!isRecord(property)) {
      continue;
    }
    const target = extractPropertyTarget(property);
    if (target !== undefined) {
      names.push(...extractPatternNames(target));
    }
  }
  return names;
};

const extractPatternNames = (pattern: unknown): readonly string[] => {
  if (!isRecord(pattern)) {
    return [];
  }
  const type = pattern['type'];
  if (type === TYPE_IDENTIFIER) {
    const name = getStringProperty(pattern, 'name');
    return name === undefined ? [] : [name];
  }
  if (type === TYPE_ASSIGNMENT_PATTERN) {
    return extractPatternNames(pattern['left']);
  }
  if (type === TYPE_REST_ELEMENT) {
    return extractPatternNames(pattern['argument']);
  }
  if (type === TYPE_ARRAY_PATTERN) {
    return extractArrayPatternNames(pattern);
  }
  if (type === TYPE_OBJECT_PATTERN) {
    return extractObjectPatternNames(pattern);
  }
  return [];
};

const isSiblingSpecifier = (specifier: string): boolean => {
  if (!specifier.startsWith('./')) {
    return false;
  }
  const remainder = specifier.slice(2);
  const hasNoSlash = !remainder.includes('/') && !remainder.includes('\\');
  const hasValidName =
    remainder.length > 0 && remainder !== '.' && remainder !== '..';
  return hasNoSlash && hasValidName;
};

const extractStemFromSpecifier = (specifier: string): string => {
  const withoutPrefix = specifier.startsWith('./')
    ? specifier.slice(2)
    : specifier;
  const lastDotIndex = withoutPrefix.lastIndexOf('.');
  if (lastDotIndex <= 0) {
    return withoutPrefix;
  }
  const extension = withoutPrefix.slice(lastDotIndex);
  const isScript = SCRIPT_EXTENSIONS.has(extension);
  return isScript ? withoutPrefix.slice(0, lastDotIndex) : withoutPrefix;
};

const isSubGraphSource = (
  source: string,
  subGraphRoles: ReadonlySet<string>
): boolean => {
  const stem = extractStemFromSpecifier(source);
  const dotParts = stem.split('.');
  if (dotParts.length < 2) {
    return false;
  }
  const roleCandidate = dotParts.at(-1) ?? '';
  return subGraphRoles.has(roleCandidate);
};

const isMasterSource = (
  source: string,
  parentDirectory: string,
  fragmentRole: string | undefined
): boolean => {
  if (fragmentRole === undefined) {
    return false;
  }
  const stem = extractStemFromSpecifier(source);
  return stem === `${parentDirectory}.${fragmentRole}`;
};

const isPosition = (value: unknown): value is TPosition =>
  isRecord(value) &&
  typeof value['line'] === 'number' &&
  typeof value['column'] === 'number';

const getNodeLocation = (node: unknown): TSourceLocation | undefined => {
  if (!isRecord(node)) {
    return undefined;
  }
  const loc = node['loc'];
  if (!isRecord(loc)) {
    return undefined;
  }
  const start = loc['start'];
  const end = loc['end'];
  if (isPosition(start) && isPosition(end)) {
    return {
      end: { column: end.column, line: end.line },
      start: { column: start.column, line: start.line },
    };
  }
  return undefined;
};

const isMainFilePath = (filePath: string, filename: string): boolean =>
  filePath === 'src/main.ts' ||
  filePath.endsWith('/src/main.ts') ||
  (filename === 'main.ts' && !filePath.includes('_src@shared'));

const isRoleInCatalog = (
  role: string,
  roles: ReadonlySet<string>,
  subGraphRoles: ReadonlySet<string>
): boolean => roles.has(role) || subGraphRoles.has(role);

const determineExplicitRole = (
  filename: string,
  roles: ReadonlySet<string>,
  subGraphRoles: ReadonlySet<string>
): undefined | { readonly name: string; readonly role: string } => {
  const dotParts = filename.split('.');
  if (dotParts.length !== 3) {
    return undefined;
  }
  const nameCandidate = dotParts[0] ?? '';
  const roleCandidate = dotParts[1] ?? '';
  return isRoleInCatalog(roleCandidate, roles, subGraphRoles)
    ? { name: nameCandidate, role: roleCandidate }
    : undefined;
};

const findFragmentRole = (
  directoryParts: readonly string[],
  categories: ReadonlyMap<string, string>
): string | undefined => {
  for (let index = directoryParts.length - 2; index >= 0; index -= 1) {
    const directoryName = directoryParts[index];
    if (directoryName !== undefined && categories.has(directoryName)) {
      return categories.get(directoryName);
    }
  }
  return undefined;
};

const classifyFile = (
  rawFilePath: string,
  options: TRuleNormalizedOptions
): TFileClassification => {
  const filePath = rawFilePath.replaceAll('\\', '/');
  const filename = filePath.split('/').at(-1) ?? '';
  const directoryParts = filePath.split('/').slice(0, -1);
  const parentDirectory = directoryParts.at(-1) ?? '';

  const isMain = isMainFilePath(filePath, filename);
  const isAccessNode =
    filename === 'index.ts' && filePath.includes('_src@shared');

  const fragmentRole = findFragmentRole(directoryParts, options.categories);

  const explicit = determineExplicitRole(
    filename,
    options.roles,
    options.subGraphRoles
  );

  if (explicit === undefined) {
    return {
      fragmentRole,
      hasAllowMultiple: false,
      isAccessNode,
      isMain,
      isMaster: false,
      isSubGraph: false,
      parentDirectory,
    };
  }

  const isSubGraph = options.subGraphRoles.has(explicit.role);
  const hasAllowMultiple = options.allowMultipleSymbols.has(explicit.role);
  const isMaster =
    !isSubGraph &&
    fragmentRole !== undefined &&
    explicit.name === parentDirectory &&
    explicit.role === fragmentRole;

  return {
    fragmentRole,
    hasAllowMultiple,
    isAccessNode,
    isMain,
    isMaster,
    isSubGraph,
    name: explicit.name,
    parentDirectory,
    role: explicit.role,
  };
};

const resolveRawCategories = (
  rawOptions: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (isRecord(rawOptions['categories'])) {
    return rawOptions['categories'];
  }
  if (isRecord(rawOptions['categoryToRole'])) {
    return rawOptions['categoryToRole'];
  }
  return undefined;
};

const extractCategories = (
  rawOptions: Record<string, unknown>,
  rawRoles: readonly unknown[]
): ReadonlyMap<string, string> => {
  const categoriesMap = new Map<string, string>();
  const rawCategories = resolveRawCategories(rawOptions);

  if (rawCategories !== undefined) {
    for (const [category, role] of Object.entries(rawCategories)) {
      if (typeof role === 'string') {
        categoriesMap.set(category, role);
      }
    }
  }

  for (const item of rawRoles) {
    if (!isRecord(item)) {
      continue;
    }

    const category = getStringProperty(item, 'category');
    const name = getStringProperty(item, 'name');
    if (category !== undefined && name !== undefined) {
      categoriesMap.set(category, name);
    }
  }

  return categoriesMap;
};

const extractRoleNames = (rawRoles: readonly unknown[]): readonly string[] => {
  const names: string[] = [];
  for (const item of rawRoles) {
    if (typeof item === 'string') {
      names.push(item);
    } else {
      const name = isRecord(item) ? getStringProperty(item, 'name') : undefined;
      if (name !== undefined) {
        names.push(name);
      }
    }
  }
  return names;
};

const normalizeOptions = (rawOptions: unknown): TRuleNormalizedOptions => {
  if (!isRecord(rawOptions)) {
    return {
      allowMultipleSymbols: new Set(),
      categories: new Map(),
      roles: new Set(),
      subGraphRoles: new Set(),
    };
  }
  const rawRoles = getArrayProperty(rawOptions, 'roles') ?? [];
  const rawMultiple =
    getArrayProperty(rawOptions, 'allowMultipleSymbols') ??
    getArrayProperty(rawOptions, 'allowMultipleSymbolsRoles') ??
    [];
  const rawSubGraph = getArrayProperty(rawOptions, 'subGraphRoles') ?? [];

  return {
    allowMultipleSymbols: new Set(
      rawMultiple.filter((item): item is string => typeof item === 'string')
    ),
    categories: extractCategories(rawOptions, rawRoles),
    roles: new Set(extractRoleNames(rawRoles)),
    subGraphRoles: new Set(
      rawSubGraph.filter((item): item is string => typeof item === 'string')
    ),
  };
};

const reportAtLocation = (
  context: Rule.RuleContext,
  messageId:
    | 'accessNode'
    | 'masterNode'
    | 'reExportProhibition'
    | 'symbolUniqueness',
  loc: TSourceLocation,
  data?: Record<string, string>
): void => {
  context.report(
    data === undefined ? { loc, messageId } : { data, loc, messageId }
  );
};

const collectDeclaratorSymbols = (
  declarator: Record<string, unknown>,
  isExported: boolean,
  fallbackLoc: TSourceLocation
): readonly TDefinedSymbol[] => {
  const loc = getNodeLocation(declarator) ?? fallbackLoc;
  const names = extractPatternNames(declarator['id']);
  return names.map((name) => ({ isExported, loc, name }));
};

const collectVariableSymbols = (
  declaration: Record<string, unknown>,
  isExported: boolean,
  fallbackLoc: TSourceLocation
): readonly TDefinedSymbol[] => {
  const declarators = getArrayProperty(declaration, 'declarations') ?? [];
  const symbols: TDefinedSymbol[] = [];
  for (const declarator of declarators) {
    if (isRecord(declarator)) {
      symbols.push(
        ...collectDeclaratorSymbols(declarator, isExported, fallbackLoc)
      );
    }
  }
  return symbols;
};

const collectFunctionSymbols = (
  declaration: Record<string, unknown>,
  isExported: boolean,
  knownFunctions: Set<string>,
  fallbackLoc: TSourceLocation
): readonly TDefinedSymbol[] => {
  const loc = getNodeLocation(declaration) ?? fallbackLoc;
  const id = declaration['id'];
  const name = isRecord(id) ? getStringProperty(id, 'name') : undefined;
  if (name !== undefined) {
    if (knownFunctions.has(name)) {
      return [];
    }
    knownFunctions.add(name);
    return [{ isExported, loc, name }];
  }
  return [{ isExported, loc }];
};

const collectTypeOrClassSymbols = (
  declaration: Record<string, unknown>,
  isExported: boolean,
  fallbackLoc: TSourceLocation
): readonly TDefinedSymbol[] => {
  const loc = getNodeLocation(declaration) ?? fallbackLoc;
  const id = declaration['id'];
  const name = isRecord(id) ? getStringProperty(id, 'name') : undefined;
  return [{ isExported, loc, name }];
};

const collectDeclarationSymbols = (
  declaration: Record<string, unknown>,
  isExported: boolean,
  knownFunctions: Set<string>,
  fallbackLoc: TSourceLocation
): readonly TDefinedSymbol[] => {
  const declarationType = declaration['type'];

  if (declarationType === TYPE_VARIABLE_DECLARATION) {
    return collectVariableSymbols(declaration, isExported, fallbackLoc);
  }

  if (
    declarationType === TYPE_FUNCTION_DECLARATION ||
    declarationType === TYPE_DECLARE_FUNCTION
  ) {
    return collectFunctionSymbols(
      declaration,
      isExported,
      knownFunctions,
      fallbackLoc
    );
  }

  if (
    typeof declarationType === 'string' &&
    TYPE_OR_CLASS_DECLARATION_TYPES.has(declarationType)
  ) {
    return collectTypeOrClassSymbols(declaration, isExported, fallbackLoc);
  }

  return [];
};

const processExportDefaultFunctionOrClass = (
  declaration: Record<string, unknown>,
  knownFunctions: Set<string>,
  loc: TSourceLocation
): { readonly symbol?: TDefinedSymbol } => {
  const id = declaration['id'];
  const name = isRecord(id) ? getStringProperty(id, 'name') : undefined;
  const isFunction = declaration['type'] === TYPE_FUNCTION_DECLARATION;
  if (isFunction && name !== undefined) {
    if (knownFunctions.has(name)) {
      return {};
    }
    knownFunctions.add(name);
  }
  return { symbol: { isExported: true, loc, name } };
};

const processExportDefault = (
  statement: Record<string, unknown>,
  importedBindings: Map<string, TImportedBinding>,
  knownFunctions: Set<string>,
  fallbackLoc: TSourceLocation
): {
  readonly reExportViolation?: TReExportRecord;
  readonly symbol?: TDefinedSymbol;
} => {
  const loc = getNodeLocation(statement) ?? fallbackLoc;
  const declaration = statement['declaration'];
  if (!isRecord(declaration)) {
    return { symbol: { isExported: true, loc } };
  }

  const declarationType = declaration['type'];
  if (
    declarationType === TYPE_FUNCTION_DECLARATION ||
    declarationType === TYPE_CLASS_DECLARATION
  ) {
    return processExportDefaultFunctionOrClass(
      declaration,
      knownFunctions,
      loc
    );
  }

  if (declarationType === TYPE_IDENTIFIER) {
    const name = getStringProperty(declaration, 'name');
    return name !== undefined && importedBindings.has(name)
      ? { reExportViolation: { loc } }
      : {};
  }

  return { symbol: { isExported: true, loc } };
};

const recordImportSpecifiers = (
  specifiers: readonly unknown[],
  source: string,
  state: TAnalysisAccumulator,
  loc: TSourceLocation
): void => {
  for (const spec of specifiers) {
    if (!isRecord(spec)) {
      continue;
    }
    const local = spec['local'];
    const name = isRecord(local) ? getStringProperty(local, 'name') : undefined;
    if (name !== undefined) {
      state.importedBindings.set(name, { loc, name, source });
    }
  }
};

const processImportStatement = (
  statement: Record<string, unknown>,
  state: TAnalysisAccumulator
): void => {
  const loc = getNodeLocation(statement) ?? state.fallbackLoc;
  const source = isRecord(statement['source'])
    ? getStringProperty(statement['source'], 'value')
    : undefined;
  const specifiers = getArrayProperty(statement, 'specifiers') ?? [];
  const isSibling =
    source !== undefined &&
    isSiblingSpecifier(source) &&
    !isSubGraphSource(source, state.subGraphRoles);

  if (!isSibling) {
    state.accessNodeInvalidSources.push(loc);
  }

  if (source !== undefined) {
    recordImportSpecifiers(specifiers, source, state, loc);
  }
};

const processExportAllStatement = (
  statement: Record<string, unknown>,
  state: TAnalysisAccumulator
): void => {
  const loc = getNodeLocation(statement) ?? state.fallbackLoc;
  const source = isRecord(statement['source'])
    ? getStringProperty(statement['source'], 'value')
    : undefined;
  state.reExportViolations.push({ loc, source });
  if (source === undefined) {
    return;
  }
  state.reExportedSources.push(source);
  const isSibling =
    isSiblingSpecifier(source) &&
    !isSubGraphSource(source, state.subGraphRoles);
  if (!isSibling) {
    state.accessNodeInvalidSources.push(loc);
  }
};

const processExportNamedWithSource = (
  source: string,
  state: TAnalysisAccumulator,
  loc: TSourceLocation
): void => {
  state.reExportViolations.push({ loc, source });
  state.reExportedSources.push(source);
  const isSibling =
    isSiblingSpecifier(source) &&
    !isSubGraphSource(source, state.subGraphRoles);
  if (!isSibling) {
    state.accessNodeInvalidSources.push(loc);
  }
};

const recordNamedExportSpecifiers = (
  specifiers: readonly unknown[],
  state: TAnalysisAccumulator,
  loc: TSourceLocation
): void => {
  for (const spec of specifiers) {
    if (!isRecord(spec)) {
      continue;
    }
    const local = spec['local'];
    const name = isRecord(local) ? getStringProperty(local, 'name') : undefined;
    const specLoc = getNodeLocation(spec) ?? loc;
    if (name !== undefined) {
      state.namedExportsPending.push({ loc: specLoc, name });
    }
  }
};

const processExportNamedStatement = (
  statement: Record<string, unknown>,
  state: TAnalysisAccumulator
): void => {
  const loc = getNodeLocation(statement) ?? state.fallbackLoc;
  const declaration = statement['declaration'];
  if (isRecord(declaration)) {
    state.definedSymbols.push(
      ...collectDeclarationSymbols(
        declaration,
        true,
        state.knownFunctions,
        state.fallbackLoc
      )
    );
    return;
  }

  const source = isRecord(statement['source'])
    ? getStringProperty(statement['source'], 'value')
    : undefined;

  if (source !== undefined) {
    processExportNamedWithSource(source, state, loc);
    return;
  }

  const specifiers = getArrayProperty(statement, 'specifiers') ?? [];
  recordNamedExportSpecifiers(specifiers, state, loc);
};

const processExportDefaultStatement = (
  statement: Record<string, unknown>,
  state: TAnalysisAccumulator
): void => {
  const loc = getNodeLocation(statement) ?? state.fallbackLoc;
  const declaration = statement['declaration'];
  if (isRecord(declaration) && declaration['type'] === TYPE_IDENTIFIER) {
    const name = getStringProperty(declaration, 'name');
    if (name !== undefined) {
      if (state.importedBindings.has(name)) {
        state.reExportViolations.push({ loc });
      } else {
        state.defaultExportPending.push({ loc, name });
      }
      return;
    }
  }

  const result = processExportDefault(
    statement,
    state.importedBindings,
    state.knownFunctions,
    state.fallbackLoc
  );
  if (result.symbol !== undefined) {
    state.definedSymbols.push(result.symbol);
  }
  if (result.reExportViolation !== undefined) {
    state.reExportViolations.push(result.reExportViolation);
  }
};

const processStatement = (
  statement: unknown,
  state: TAnalysisAccumulator
): void => {
  if (!isRecord(statement)) {
    return;
  }
  const statementType = statement['type'];
  if (statementType === TYPE_IMPORT_DECLARATION) {
    processImportStatement(statement, state);
    return;
  }
  if (statementType === TYPE_EXPORT_ALL_DECLARATION) {
    processExportAllStatement(statement, state);
    return;
  }
  if (statementType === TYPE_EXPORT_NAMED_DECLARATION) {
    processExportNamedStatement(statement, state);
    return;
  }
  if (statementType === TYPE_EXPORT_DEFAULT_DECLARATION) {
    processExportDefaultStatement(statement, state);
    return;
  }

  const ownSymbols = collectDeclarationSymbols(
    statement,
    false,
    state.knownFunctions,
    state.fallbackLoc
  );
  if (ownSymbols.length > 0) {
    state.definedSymbols.push(...ownSymbols);
  } else {
    const loc = getNodeLocation(statement) ?? state.fallbackLoc;
    state.accessNodeInvalidStatements.push(loc);
  }
};

const resolvePendingNamedExports = (
  pendingList: readonly {
    readonly loc: TSourceLocation;
    readonly name: string;
  }[],
  importedBindings: Map<string, TImportedBinding>,
  definedNames: Set<string>,
  reExportViolations: TReExportRecord[],
  reExportedSources: string[]
): Set<string> => {
  const exportedViaNamed = new Set<string>();
  for (const pending of pendingList) {
    const isImported = importedBindings.has(pending.name);
    const isDefined = definedNames.has(pending.name);
    if (isImported && !isDefined) {
      reExportViolations.push({ loc: pending.loc });
      const imported = importedBindings.get(pending.name);
      if (imported !== undefined) {
        reExportedSources.push(imported.source);
      }
    } else {
      if (isDefined) {
        exportedViaNamed.add(pending.name);
      }
    }
  }
  return exportedViaNamed;
};

const analyzeProgram = (
  body: readonly unknown[],
  fallbackLoc: TSourceLocation,
  subGraphRoles: ReadonlySet<string>
): TAnalysisResult => {
  const state: TAnalysisAccumulator = {
    accessNodeInvalidSources: [],
    accessNodeInvalidStatements: [],
    defaultExportPending: [],
    definedSymbols: [],
    fallbackLoc,
    importedBindings: new Map(),
    knownFunctions: new Set(),
    namedExportsPending: [],
    reExportedSources: [],
    reExportViolations: [],
    subGraphRoles,
  };

  for (const statement of body) {
    processStatement(statement, state);
  }

  const definedNames = new Set(
    state.definedSymbols
      .map((s) => s.name)
      .filter((n): n is string => n !== undefined)
  );

  const exportedViaNamed = resolvePendingNamedExports(
    state.namedExportsPending,
    state.importedBindings,
    definedNames,
    state.reExportViolations,
    state.reExportedSources
  );

  for (const pending of state.defaultExportPending) {
    if (definedNames.has(pending.name)) {
      exportedViaNamed.add(pending.name);
    } else {
      state.definedSymbols.push({
        isExported: true,
        loc: pending.loc,
        name: pending.name,
      });
    }
  }

  let exportedCount = state.definedSymbols.filter((s) => s.isExported).length;
  for (const symbol of state.definedSymbols) {
    const isExportedViaNamed =
      !symbol.isExported &&
      symbol.name !== undefined &&
      exportedViaNamed.has(symbol.name);
    if (isExportedViaNamed) {
      exportedCount += 1;
    }
  }

  return {
    accessNodeInvalidSources: state.accessNodeInvalidSources,
    accessNodeInvalidStatements: state.accessNodeInvalidStatements,
    definedSymbols: state.definedSymbols,
    exportedCount,
    reExportedSources: state.reExportedSources,
    reExportViolations: state.reExportViolations,
  };
};

const checkAccessNodeFile = (
  context: Rule.RuleContext,
  classification: TFileClassification,
  analysis: TAnalysisResult,
  fallbackLoc: TSourceLocation
): void => {
  if (analysis.definedSymbols.length > 0) {
    const loc = analysis.definedSymbols[0]?.loc ?? fallbackLoc;
    reportAtLocation(context, 'accessNode', loc);
    return;
  }
  if (analysis.accessNodeInvalidStatements.length > 0) {
    const loc = analysis.accessNodeInvalidStatements[0] ?? fallbackLoc;
    reportAtLocation(context, 'accessNode', loc);
    return;
  }
  if (analysis.accessNodeInvalidSources.length > 0) {
    const loc = analysis.accessNodeInvalidSources[0] ?? fallbackLoc;
    reportAtLocation(context, 'accessNode', loc);
    return;
  }
  const hasMaster =
    classification.fragmentRole !== undefined &&
    analysis.reExportedSources.some((source) =>
      isMasterSource(
        source,
        classification.parentDirectory,
        classification.fragmentRole
      )
    );
  if (!hasMaster) {
    reportAtLocation(context, 'accessNode', fallbackLoc);
  }
};

const checkMasterRoleFile = (
  context: Rule.RuleContext,
  analysis: TAnalysisResult,
  fallbackLoc: TSourceLocation
): void => {
  const isMasterCompliant =
    analysis.definedSymbols.length === 1 && analysis.exportedCount === 1;
  if (isMasterCompliant) {
    return;
  }
  const targetLoc =
    analysis.definedSymbols.length > 1
      ? (analysis.definedSymbols[1]?.loc ?? fallbackLoc)
      : (analysis.definedSymbols[0]?.loc ?? fallbackLoc);
  reportAtLocation(context, 'masterNode', targetLoc, {
    definedCount: String(analysis.definedSymbols.length),
    exportedCount: String(analysis.exportedCount),
  });
};

const checkNonMasterRoleFile = (
  context: Rule.RuleContext,
  classification: TFileClassification,
  analysis: TAnalysisResult,
  fallbackLoc: TSourceLocation
): void => {
  if (
    classification.isSubGraph ||
    classification.hasAllowMultiple ||
    analysis.definedSymbols.length <= 1
  ) {
    return;
  }
  const secondLoc = analysis.definedSymbols[1]?.loc ?? fallbackLoc;
  reportAtLocation(context, 'symbolUniqueness', secondLoc, {
    count: String(analysis.definedSymbols.length),
  });
};

const checkExplicitRoleFile = (
  context: Rule.RuleContext,
  classification: TFileClassification,
  analysis: TAnalysisResult,
  fallbackLoc: TSourceLocation
): void => {
  for (const violation of analysis.reExportViolations) {
    reportAtLocation(context, 'reExportProhibition', violation.loc);
  }

  if (classification.isMaster) {
    checkMasterRoleFile(context, analysis, fallbackLoc);
  } else {
    checkNonMasterRoleFile(context, classification, analysis, fallbackLoc);
  }
};

export const symbolLawsRule: Rule.RuleModule = {
  create(context) {
    return {
      Program(programNode) {
        const options = normalizeOptions(context.options[0]);
        const fallbackLoc = getNodeLocation(programNode) ?? DEFAULT_LOCATION;

        const classification = classifyFile(context.filename, options);
        if (classification.isMain) {
          return;
        }

        const analysis = analyzeProgram(
          programNode.body,
          fallbackLoc,
          options.subGraphRoles
        );

        if (classification.isAccessNode) {
          checkAccessNodeFile(context, classification, analysis, fallbackLoc);
          return;
        }

        if (classification.role === undefined) {
          return;
        }

        checkExplicitRoleFile(context, classification, analysis, fallbackLoc);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce FAF symbol laws: symbol uniqueness, master node contract, re-export prohibition, and access node contract.',
    },
    messages: {
      accessNode:
        'Access Node must not define own symbols, must only re-export sibling fragment nodes in the same directory, and must re-export the directory Master node (FAF §6.1.1).',
      masterNode:
        'A Master node must define and export exactly one symbol (FAF §6.1.1). Found {{definedCount}} defined and {{exportedCount}} exported.',
      reExportProhibition:
        'Re-exporting imported symbols is forbidden for files with an explicit role (FAF §5).',
      symbolUniqueness:
        'A file with an explicit role that does not allow multiple symbols must define at most one symbol (FAF §5). Found {{count}} symbols.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allowMultipleSymbols: {
            items: { type: 'string' },
            type: 'array',
          },
          allowMultipleSymbolsRoles: {
            items: { type: 'string' },
            type: 'array',
          },
          categories: {
            additionalProperties: { type: 'string' },
            type: 'object',
          },
          categoryToRole: {
            additionalProperties: { type: 'string' },
            type: 'object',
          },
          roles: {
            items: {
              anyOf: [
                { type: 'string' },
                {
                  additionalProperties: true,
                  properties: {
                    category: { type: 'string' },
                    name: { type: 'string' },
                  },
                  required: ['name'],
                  type: 'object',
                },
              ],
            },
            type: 'array',
          },
          subGraphRoles: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
};

import type { Rule } from 'eslint';

const SKIPPED_CHILD_KEYS = new Set(['end', 'loc', 'parent', 'range', 'start']);
const EXEMPT_ROLES = new Set(['adapter', 'schema']);

const isNode = (value: unknown): value is Rule.Node =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  typeof value.type === 'string';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const appendNode = (children: Rule.Node[], value: unknown): void => {
  if (isNode(value)) {
    children.push(value);
  }
};

const appendChildren = (children: Rule.Node[], value: unknown): void => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      appendNode(children, entry);
    }
    return;
  }
  appendNode(children, value);
};

const childNodes = (node: Rule.Node): readonly Rule.Node[] => {
  const children: Rule.Node[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (!SKIPPED_CHILD_KEYS.has(key)) {
      appendChildren(children, value);
    }
  }
  return children;
};

const reportUnknownKeywords = (
  context: Rule.RuleContext,
  annotation: Rule.Node
): void => {
  const pending = [annotation];
  const seen = new Set<Rule.Node>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const nodeType: string = current.type;
    if (nodeType === 'TSUnknownKeyword') {
      context.report({
        messageId: 'unknownParameter',
        node: current,
      });
    }
    for (const child of childNodes(current)) {
      pending.push(child);
    }
  }
};

const readIdentifierName = (value: unknown): string | undefined => {
  if (!isRecord(value) || value['type'] !== 'Identifier') {
    return undefined;
  }
  const name = value['name'];
  return typeof name === 'string' ? name : undefined;
};

const readParameterName = (parameter: unknown): string | undefined => {
  if (!isRecord(parameter)) {
    return undefined;
  }
  if (
    parameter['type'] === 'AssignmentPattern' ||
    parameter['type'] === 'RestElement'
  ) {
    return readParameterName(parameter['left'] ?? parameter['argument']);
  }
  return readIdentifierName(parameter);
};

const readTypeAnnotation = (parameter: unknown): null | Rule.Node => {
  if (!isRecord(parameter)) {
    return null;
  }
  if (parameter['type'] === 'AssignmentPattern') {
    return readTypeAnnotation(parameter['left']);
  }
  const annotation = parameter['typeAnnotation'];
  return isNode(annotation) ? annotation : null;
};

const readPredicateSubject = (node: unknown): string | undefined => {
  const returnType = isRecord(node) ? node['returnType'] : undefined;
  const predicate = isRecord(returnType)
    ? returnType['typeAnnotation']
    : undefined;
  return isRecord(predicate) &&
    predicate['type'] === 'TSTypePredicate' &&
    isNode(predicate['typeAnnotation'])
    ? readIdentifierName(predicate['parameterName'])
    : undefined;
};

const explicitFileRole = (filename: string): string | undefined => {
  const normalized = filename.replaceAll('\\', '/');
  const baseName = normalized.slice(normalized.lastIndexOf('/') + 1);
  const dotParts = baseName.split('.');
  return dotParts.length === 3 ? dotParts[1] : undefined;
};

const isSchemaSpecifier = (specifier: unknown): boolean =>
  typeof specifier === 'string' &&
  (specifier.includes('/_schemas/') || specifier.endsWith('.schema.js'));

const isRuntimeSchemaImport = (statement: unknown): boolean => {
  if (
    !isRecord(statement) ||
    statement['type'] !== 'ImportDeclaration' ||
    statement['importKind'] === 'type'
  ) {
    return false;
  }
  const source = statement['source'];
  return isRecord(source) && isSchemaSpecifier(source['value']);
};

const hasRuntimeSchemaImport = (context: Rule.RuleContext): boolean =>
  context.sourceCode.ast.body.some((statement) =>
    isRuntimeSchemaImport(statement)
  );

const isExemptFile = (context: Rule.RuleContext): boolean => {
  const role = explicitFileRole(context.filename) ?? '';
  return (
    EXEMPT_ROLES.has(role) ||
    (role === 'util' && hasRuntimeSchemaImport(context))
  );
};

const checkFunction = (context: Rule.RuleContext, node: unknown): void => {
  if (!isRecord(node)) {
    return;
  }
  const parameters = node['params'];
  if (!Array.isArray(parameters)) {
    return;
  }
  const predicateSubject = readPredicateSubject(node);
  for (const parameter of parameters) {
    if (
      predicateSubject !== undefined &&
      readParameterName(parameter) === predicateSubject
    ) {
      continue;
    }
    const annotation = readTypeAnnotation(parameter);
    if (annotation !== null) {
      reportUnknownKeywords(context, annotation);
    }
  }
};

export const noUnknownParametersRule: Rule.RuleModule = {
  create(context) {
    if (isExemptFile(context)) {
      return {};
    }

    return {
      ArrowFunctionExpression(node: unknown) {
        checkFunction(context, node);
      },
      FunctionDeclaration(node: unknown) {
        checkFunction(context, node);
      },
      FunctionExpression(node: unknown) {
        checkFunction(context, node);
      },
      TSDeclareFunction(node: unknown) {
        checkFunction(context, node);
      },
      TSEmptyBodyFunctionExpression(node: unknown) {
        checkFunction(context, node);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Forbid unknown in function parameter type annotations unless the parameter is the subject of a type predicate or the file Role is adapter or schema.',
    },
    messages: {
      unknownParameter:
        'Function parameters must not use unknown unless the function is a type guard or assertion on that parameter, or the file Role is adapter or schema.',
    },
    schema: [],
    type: 'problem',
  },
};

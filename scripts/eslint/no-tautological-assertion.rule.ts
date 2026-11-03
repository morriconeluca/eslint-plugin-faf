import type { Rule, Scope } from 'eslint';

const EXECUTION_NODE_TYPES = new Set([
  'AwaitExpression',
  'CallExpression',
  'NewExpression',
  'TaggedTemplateExpression',
]);

const SKIPPED_CHILD_KEYS = new Set(['end', 'loc', 'parent', 'range', 'start']);

const CONSTANT_MODULE_PATTERN = /\.(?:config|constant)\.js$/u;

type TMaterialQuery = {
  readonly sourceCode: Rule.RuleContext['sourceCode'];
  readonly stack: ReadonlySet<Scope.Variable>;
};

type TRangedNode = {
  readonly range?: null | readonly [number, number];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNode = (value: unknown): value is Rule.Node =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  typeof value.type === 'string';

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

const hasMatchingRanges = (
  leftRange: readonly [number, number],
  rightRange: readonly [number, number]
): boolean => leftRange[0] === rightRange[0] && leftRange[1] === rightRange[1];

const hasSameRange = (left: Rule.Node, right: TRangedNode): boolean => {
  const leftRange = left.range;
  const rightRange = right.range;
  return (
    leftRange !== undefined &&
    rightRange != null &&
    hasMatchingRanges(leftRange, rightRange)
  );
};

const isReferencedIdentifier = (
  identifier: Rule.Node,
  sourceCode: Rule.RuleContext['sourceCode']
): boolean => {
  let scope: null | Scope.Scope = sourceCode.getScope(identifier);
  while (scope !== null) {
    const isFound = scope.references.some((reference) =>
      hasSameRange(identifier, reference.identifier)
    );
    if (isFound) {
      return true;
    }
    scope = scope.upper;
  }
  return false;
};

const collectReferences = (
  root: Rule.Node,
  sourceCode: Rule.RuleContext['sourceCode']
): readonly Rule.Node[] => {
  const references: Rule.Node[] = [];
  const pending = [root];
  const seen = new Set<Rule.Node>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    seen.add(current);
    if (
      current.type === 'Identifier' &&
      isReferencedIdentifier(current, sourceCode)
    ) {
      references.push(current);
    }
    for (const child of childNodes(current)) {
      pending.push(child);
    }
  }
  return references;
};

const hasExecution = (node: Rule.Node): boolean => {
  const pending = [node];
  const seen = new Set<Rule.Node>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    seen.add(current);
    if (EXECUTION_NODE_TYPES.has(current.type)) {
      return true;
    }
    for (const child of childNodes(current)) {
      pending.push(child);
    }
  }
  return false;
};

const findVariable = (
  identifier: Rule.Node & { readonly name: string },
  sourceCode: Rule.RuleContext['sourceCode']
): null | Scope.Variable => {
  let scope: null | Scope.Scope = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }
  return null;
};

const readImportSource = (variable: Scope.Variable): null | string => {
  const binding = variable.defs.find(
    (definition) => definition.type === 'ImportBinding'
  );
  if (binding?.type !== 'ImportBinding') {
    return null;
  }
  const value = binding.parent.source.value;
  return typeof value === 'string' ? value : null;
};

const readConstInitializer = (variable: Scope.Variable): null | Rule.Node => {
  const definition = variable.defs.find((entry) => entry.type === 'Variable');
  if (definition?.type !== 'Variable' || definition.parent.kind !== 'const') {
    return null;
  }
  const initializer: unknown = definition.node.init;
  return isNode(initializer) ? initializer : null;
};

const isConstantDerivedReference = (
  identifier: Rule.Node,
  query: TMaterialQuery
): boolean => {
  if (identifier.type !== 'Identifier') {
    return false;
  }
  const variable = findVariable(identifier, query.sourceCode);
  if (variable === null || query.stack.has(variable)) {
    return false;
  }
  const source = readImportSource(variable);
  if (source !== null && CONSTANT_MODULE_PATTERN.test(source)) {
    return true;
  }
  const initializer = readConstInitializer(variable);
  if (initializer === null) {
    return false;
  }
  const nextStack = new Set(query.stack);
  nextStack.add(variable);
  return isConstantMaterial(initializer, {
    sourceCode: query.sourceCode,
    stack: nextStack,
  });
};

const isConstantMaterial = (
  node: Rule.Node,
  query: TMaterialQuery
): boolean => {
  if (hasExecution(node)) {
    return false;
  }
  const references = collectReferences(node, query.sourceCode);
  return (
    references.length > 0 &&
    references.every((reference) =>
      isConstantDerivedReference(reference, query)
    )
  );
};

const isExpectCallee = (callee: unknown): boolean => {
  if (!isRecord(callee)) {
    return false;
  }
  if (callee['type'] === 'Identifier') {
    return callee['name'] === 'expect';
  }
  if (callee['type'] !== 'MemberExpression' || callee['computed'] === true) {
    return false;
  }
  const object = callee['object'];
  const property = callee['property'];
  const isExpectObject =
    isRecord(object) &&
    object['type'] === 'Identifier' &&
    object['name'] === 'expect';
  const isSoftProperty =
    isRecord(property) &&
    property['type'] === 'Identifier' &&
    property['name'] === 'soft';
  return isExpectObject && isSoftProperty;
};

const reportTautology = (
  context: Rule.RuleContext,
  node: { readonly arguments: readonly unknown[] }
): void => {
  const subject = node.arguments[0];
  if (!isNode(subject) || subject.type === 'SpreadElement') {
    return;
  }
  const isTautology = isConstantMaterial(subject, {
    sourceCode: context.sourceCode,
    stack: new Set(),
  });
  if (isTautology) {
    context.report({
      messageId: 'tautologicalAssertion',
      node: subject,
    });
  }
};

export const noTautologicalAssertionRule: Rule.RuleModule = {
  create(context) {
    return {
      CallExpression(node) {
        if (isExpectCallee(node.callee)) {
          reportTautology(context, node);
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Forbid expect subjects that do not execute code and are derived only from constant or config imports.',
    },
    messages: {
      tautologicalAssertion:
        'Tautological assertion: the expect subject does not execute code and is derived only from a *.constant.js or *.config.js import. Assert an observable output and fix the expected value as a literal.',
    },
    schema: [],
    type: 'problem',
  },
};

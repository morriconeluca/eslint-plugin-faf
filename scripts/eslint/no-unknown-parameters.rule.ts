import type { Rule } from 'eslint';

const SKIPPED_CHILD_KEYS = new Set(['end', 'loc', 'parent', 'range', 'start']);

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

const directoryOf = (filename: string): string => {
  const normalized = filename.replaceAll('\\', '/');
  const slash = normalized.lastIndexOf('/');
  return slash === -1 ? '' : normalized.slice(0, slash);
};

const isFragmentMatch = (directory: string, fragment: string): boolean => {
  const normalized = fragment.replaceAll('\\', '/').replace(/\/$/u, '');
  return directory === normalized || directory.endsWith(`/${normalized}`);
};

const isAllowedFragment = (
  filename: string,
  fragments: readonly string[]
): boolean => {
  const directory = directoryOf(filename);
  return fragments.some((fragment) => isFragmentMatch(directory, fragment));
};

const readAllowedFragments = (
  options: readonly unknown[]
): readonly string[] => {
  const first = options[0];
  if (
    typeof first !== 'object' ||
    first === null ||
    !('allowedFragments' in first)
  ) {
    return [];
  }
  const { allowedFragments } = first;
  return Array.isArray(allowedFragments)
    ? allowedFragments.filter(
        (entry): entry is string => typeof entry === 'string'
      )
    : [];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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

const checkFunction = (context: Rule.RuleContext, node: unknown): void => {
  if (!isRecord(node)) {
    return;
  }
  const parameters = node['params'];
  if (!Array.isArray(parameters)) {
    return;
  }
  for (const parameter of parameters) {
    const annotation = readTypeAnnotation(parameter);
    if (annotation !== null) {
      reportUnknownKeywords(context, annotation);
    }
  }
};

export const noUnknownParametersRule: Rule.RuleModule = {
  create(context) {
    const allowedFragments = readAllowedFragments(context.options);
    if (isAllowedFragment(context.filename, allowedFragments)) {
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
        'Forbid unknown in function parameter type annotations outside explicit external boundaries.',
    },
    messages: {
      unknownParameter:
        'Function parameters must not use unknown. Narrow external values at an allowed boundary and pass an exact type.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          allowedFragments: {
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

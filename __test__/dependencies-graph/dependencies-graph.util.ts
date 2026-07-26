import type { ICruiseResult, IViolation } from 'dependency-cruiser';

export const isCruiseResult = (output: unknown): output is ICruiseResult => {
  return typeof output === 'object' && output !== null && 'summary' in output;
};

export const formatViolation = (v: IViolation) => {
  if (v.rule.name === 'no-circular') {
    const pathChain = v.cycle
      ? `${v.cycle.map((c) => c.name).join(' -> ')} -> ${v.cycle[0]?.name ?? ''}`
      : `${v.from} -> ${v.to}`;
    return `Cycle detected: ${pathChain}`;
  }

  if (v.rule.name === 'no-orphans') {
    return `Orphan module: ${v.from}`;
  }

  if (v.rule.name === 'no-dist-imports') {
    return `Forbidden import from dist/ inside ${v.from} -> importing ${v.to}`;
  }

  return `${v.rule.name}: ${v.from} -> ${v.to}`;
};

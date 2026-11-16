---
'@morriconeluca/eslint-plugin-faf': patch
---

Fix an algorithmic soundness bug in `dependency/fractal-branch-unidirectionality` by removing unsound cross-source memoization in `findBranchViolationPaths` so indirect violations from nested Fractal Branches routed through deeper outer Fractal Branch nodes are always detected.

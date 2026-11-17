---
'@morriconeluca/eslint-plugin-faf': patch
---

Fix external inventory discovery in `includeExternalTargets` so source dot-directories (such as `.storybook/`), nested artifact-named directories (such as `__test__/build/`), active ESLint file overlays, and configuration-referenced paths outside Fractal Trees are accurately indexed instead of being silently skipped or misreported as `configuration/non-existent-path`.

---
'@morriconeluca/eslint-plugin-faf': patch
---

Fix a false negative in `classification/category-role` so every non-Foreign direct file (including absent-Role files and `index.ts`) inside a non-mimetic Category of Fragments or Sub-Category of Fragments is reported as a violation.

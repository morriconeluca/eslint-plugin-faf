# eslint-plugin-faf

An ESLint plugin containing custom rules and flat configurations for FAF projects.

[![CI Status](https://github.com/lucamorricone/eslint-plugin-faf/actions/workflows/ci.yml/badge.svg)](https://github.com/lucamorricone/eslint-plugin-faf/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Installation

Install using npm:

```bash
npm install eslint-plugin-faf --save-dev
```

---

## Usage

This plugin supports ESLint's modern **Flat Configuration** format.

Add the recommended ruleset to your `eslint.config.js`:

```javascript
import fafPlugin from 'eslint-plugin-faf';

export default [
  // Include the recommended configuration directly
  fafPlugin.configs.recommended,

  // Or configure individual rules
  {
    plugins: {
      faf: fafPlugin,
    },
    rules: {
      'faf/no-foo': 'error',
    },
  },
];
```

---

## Supported Rules

| Rule Name                            | Description                            | Recommended |
| :----------------------------------- | :------------------------------------- | :---------- |
| [`faf/no-foo`](docs/rules/no-foo.md) | Bans the use of variables named "foo". | `error`     |

---

## Contributing

If you want to add new rules, modify configurations, or run tests, see [CONTRIBUTING.md](CONTRIBUTING.md) for local development instructions.

---

## License

This project is licensed under the [MIT License](LICENSE).

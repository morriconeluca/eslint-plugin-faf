import { describe, expect, it } from 'vitest';

import { produceStyleModuleRecord } from './produce-style-module-record.util.js';

describe('produceStyleModuleRecord', () => {
  it('produces empty module record for empty stylesheet with style language classification', () => {
    const result = produceStyleModuleRecord('style.css', '');

    expect(result.language).toBe('style');
    expect(result.exports).toEqual([]);
    expect(result.symbols).toEqual([]);
    expect(result.imports).toEqual([]);
    expect(result.unsupportedSyntaxes).toEqual([]);
  });

  it('produces no symbols and no exports even when multiple CSS rules are present', () => {
    const css = [
      '.button {',
      '  display: inline-block;',
      '  padding: 8px 16px;',
      '  color: #333;',
      '}',
      '.button:hover {',
      '  background-color: #f0f0f0;',
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('button.module.css', css);

    expect(result.language).toBe('style');
    expect(result.symbols).toHaveLength(0);
    expect(result.exports).toHaveLength(0);
    expect(result.imports).toHaveLength(0);
  });

  it('extracts @import declarations with double and single quotes', () => {
    const css = ['@import "reset.css";', "@import 'typography.css';"].join(
      '\n'
    );
    const result = produceStyleModuleRecord('styles.css', css);

    expect(result.imports).toHaveLength(2);
    expect(result.imports[0]).toEqual({
      isTypeOnly: false,
      kind: 'css-at-import',
      position: { column: 1, line: 1 },
      specifier: './reset.css',
    });
    expect(result.imports[1]).toEqual({
      isTypeOnly: false,
      kind: 'css-at-import',
      position: { column: 1, line: 2 },
      specifier: './typography.css',
    });
  });

  it('normalizes bare relative references to start with ./', () => {
    const css = [
      '@import "components/button.css";',
      '.icon {',
      '  background: url(images/icon.png);',
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('theme.css', css);

    expect(result.imports[0]?.specifier).toBe('./components/button.css');
    expect(result.imports[1]?.specifier).toBe('./images/icon.png');
  });

  it('preserves existing ./ and ../ relative specifiers without alteration', () => {
    const css = [
      '@import "./variables.css";',
      '@import "../common/base.css";',
      '.bg {',
      "  background: url('./assets/bg.jpg');",
      '}',
      '.font {',
      "  src: url('../fonts/inter.woff2');",
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('src/theme.css', css);

    expect(result.imports[0]?.specifier).toBe('./variables.css');
    expect(result.imports[1]?.specifier).toBe('../common/base.css');
    expect(result.imports[2]?.specifier).toBe('./assets/bg.jpg');
    expect(result.imports[3]?.specifier).toBe('../fonts/inter.woff2');
  });

  it('extracts @import with url() syntax', () => {
    const css = [
      '@import url("theme.css");',
      "@import url('fonts.css');",
      '@import url(base.css);',
    ].join('\n');
    const result = produceStyleModuleRecord('main.css', css);

    expect(result.imports).toHaveLength(3);
    expect(result.imports[0]?.kind).toBe('css-at-import');
    expect(result.imports[0]?.specifier).toBe('./theme.css');
    expect(result.imports[1]?.specifier).toBe('./fonts.css');
    expect(result.imports[2]?.specifier).toBe('./base.css');
  });

  it('extracts @import with media queries, layer(), and supports() clauses', () => {
    const css = [
      '@import "mobile.css" screen and (max-width: 768px);',
      '@import url("utilities.css") layer(framework.utilities);',
      '@import "grid.css" supports(display: grid);',
    ].join('\n');
    const result = produceStyleModuleRecord('responsive.css', css);

    expect(result.imports).toHaveLength(3);
    expect(result.imports[0]?.specifier).toBe('./mobile.css');
    expect(result.imports[1]?.specifier).toBe('./utilities.css');
    expect(result.imports[2]?.specifier).toBe('./grid.css');
  });

  it('extracts standalone url() references from property declarations', () => {
    const css = [
      '@font-face {',
      "  font-family: 'Roboto';",
      "  src: url('fonts/roboto.woff2') format('woff2');",
      '}',
      '.card {',
      '  background-image: url("img/card-bg.png");',
      '  cursor: url(cursor.cur), auto;',
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('component.css', css);

    expect(result.imports).toHaveLength(3);
    expect(result.imports[0]).toEqual({
      isTypeOnly: false,
      kind: 'css-url',
      position: { column: 8, line: 3 },
      specifier: './fonts/roboto.woff2',
    });
    expect(result.imports[1]?.specifier).toBe('./img/card-bg.png');
    expect(result.imports[2]?.specifier).toBe('./cursor.cur');
  });

  it('excludes non-codebase references from dependency edges', () => {
    const css = [
      '@import "https://cdn.example.com/external.css";',
      "@import 'https://cdn.example.com/external.css';",
      "@import '//cdn.example.com/external.css';",
      '@import "data:text/css;base64,...";',
      '@import "";',
      '@import url();',
      '.logo {',
      "  background: url('https://cdn.example.com/logo.png');",
      '  background-image: url("data:image/svg+xml;base64,...");',
      '  mask: url(#svg-mask);',
      '  cursor: url();',
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('external.css', css);

    expect(result.imports).toHaveLength(0);
    expect(result.unsupportedSyntaxes).toHaveLength(0);
  });

  it('handles ~pkg package-relative specifiers as non-literal imports with unsupported syntax', () => {
    const css = [
      '@import "~bootstrap/dist/css/bootstrap.css";',
      '.icon {',
      "  background: url('~my-icons/svg/check.svg');",
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('app.scss', css);

    expect(result.imports).toHaveLength(2);
    expect(result.imports[0]).toEqual({
      isTypeOnly: false,
      kind: 'css-at-import',
      position: { column: 1, line: 1 },
      specifier: null,
    });
    expect(result.imports[1]).toEqual({
      isTypeOnly: false,
      kind: 'css-url',
      position: { column: 15, line: 3 },
      specifier: null,
    });
    expect(result.unsupportedSyntaxes).toHaveLength(2);
  });

  it('handles /x absolute path specifiers as non-literal imports with unsupported syntax', () => {
    const css = [
      '@import "/styles/global.css";',
      '.banner {',
      "  background: url('/assets/banner.png');",
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('styles.css', css);

    expect(result.imports).toHaveLength(2);
    expect(result.imports[0]?.specifier).toBeNull();
    expect(result.imports[1]?.specifier).toBeNull();
    expect(result.unsupportedSyntaxes).toHaveLength(2);
  });

  it('handles interpolation expressions in @import and url() as unsupported syntax', () => {
    const css = [
      '@import "#{$theme}/palette.css";',
      '@import "@{theme}/palette.less";',
      '.icon {',
      '  background: url(#{$icon-path}/logo.svg);',
      '  background-image: url("@{images}/icon.png");',
      '  mask: url(var(--dynamic-mask));',
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('dynamic.scss', css);

    expect(result.imports).toHaveLength(5);
    for (const importItem of result.imports) {
      expect(importItem.specifier).toBeNull();
    }
    expect(result.unsupportedSyntaxes).toHaveLength(5);
  });

  it('ignores comments and non-pertinent strings in stylesheet text', () => {
    const css = [
      '/* @import "ignored-block.css"; */',
      '/*',
      '  .ignored {',
      '    background: url("ignored-in-comment.png");',
      '  }',
      '*/',
      '.card::before {',
      "  content: \"@import 'fake.css'; url('fake.png');\";",
      '}',
      '.active {',
      '  color: var(--primary);',
      '}',
    ].join('\n');
    const result = produceStyleModuleRecord('clean.css', css);

    expect(result.imports).toHaveLength(0);
    expect(result.unsupportedSyntaxes).toHaveLength(0);
  });

  it('ignores single-line comments in .scss, .sass, and .less files', () => {
    const scss = [
      '// @import "ignored-single-line.scss";',
      "// url('ignored-line-url.png');",
      '@import "active.scss";',
    ].join('\n');
    const result = produceStyleModuleRecord('style.scss', scss);

    expect(result.imports).toHaveLength(1);
    expect(result.imports[0]?.specifier).toBe('./active.scss');
  });

  it('does not treat double slash as comment in standard .css files', () => {
    const css = '// @import "not-a-comment.css";';
    const result = produceStyleModuleRecord('style.css', css);

    expect(result.imports).toHaveLength(1);
    expect(result.imports[0]?.specifier).toBe('./not-a-comment.css');
  });

  it('handles indented Sass syntax with newline statement terminators', () => {
    const sass = [
      '@import reset',
      '@import typography',
      '.button',
      '  background: url("logo.png")',
    ].join('\n');
    const result = produceStyleModuleRecord('main.sass', sass);

    expect(result.imports).toHaveLength(3);
    expect(result.imports[0]?.specifier).toBe('./reset');
    expect(result.imports[1]?.specifier).toBe('./typography');
    expect(result.imports[2]?.specifier).toBe('./logo.png');
  });
});

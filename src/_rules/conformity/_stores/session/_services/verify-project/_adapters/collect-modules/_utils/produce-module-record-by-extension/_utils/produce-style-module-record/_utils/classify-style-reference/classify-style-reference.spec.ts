import { describe, expect, it } from 'vitest';

import { classifyStyleReference } from './classify-style-reference.util.js';

describe('classifyStyleReference', () => {
  const position = { column: 5, line: 3 };

  it('excludes empty strings', () => {
    expect(classifyStyleReference('css-url', position, '')).toEqual({});
    expect(classifyStyleReference('css-url', position, ' '.repeat(3))).toEqual(
      {}
    );
    expect(classifyStyleReference('css-url', position, '""')).toEqual({});
    expect(classifyStyleReference('css-url', position, "''")).toEqual({});
  });

  it('excludes fragment-only references', () => {
    expect(
      classifyStyleReference('css-url', position, '#my-svg-filter')
    ).toEqual({});
    expect(classifyStyleReference('css-url', position, "'#filter'")).toEqual(
      {}
    );
  });

  it('excludes non-codebase protocol references', () => {
    expect(
      classifyStyleReference(
        'css-url',
        position,
        'data:image/svg+xml;base64,123'
      )
    ).toEqual({});
    expect(
      classifyStyleReference(
        'css-at-import',
        position,
        'https://example.com/style.css'
      )
    ).toEqual({});
    expect(
      classifyStyleReference(
        'css-at-import',
        position,
        'https://example.com/style.css'
      )
    ).toEqual({});
    expect(
      classifyStyleReference(
        'css-url',
        position,
        '//cdn.example.com/font.woff2'
      )
    ).toEqual({});
  });

  it('handles package-relative references ~pkg as non-literal import with unsupported syntax', () => {
    const result = classifyStyleReference(
      'css-at-import',
      position,
      '~bootstrap/dist/css/bootstrap.css'
    );

    expect(result.importItem).toEqual({
      isTypeOnly: false,
      kind: 'css-at-import',
      position,
      specifier: null,
    });
    expect(result.unsupportedSyntax).toEqual({
      description:
        "Package-relative specifiers (~pkg) in stylesheets are unsupported: '~bootstrap/dist/css/bootstrap.css'",
      position,
    });
  });

  it('handles absolute references /x as non-literal import with unsupported syntax', () => {
    const result = classifyStyleReference(
      'css-url',
      position,
      '/assets/images/logo.png'
    );

    expect(result.importItem).toEqual({
      isTypeOnly: false,
      kind: 'css-url',
      position,
      specifier: null,
    });
    expect(result.unsupportedSyntax).toEqual({
      description:
        "Absolute path specifiers (/x) in stylesheets are unsupported: '/assets/images/logo.png'",
      position,
    });
  });

  it('detects interpolations and produces non-literal import with unsupported syntax', () => {
    const variableResult = classifyStyleReference(
      'css-url',
      position,
      'var(--theme-font)'
    );
    expect(variableResult.importItem).toEqual({
      isTypeOnly: false,
      kind: 'css-url',
      position,
      specifier: null,
    });
    expect(variableResult.unsupportedSyntax).toEqual({
      description:
        'Interpolated expressions in stylesheet references are unsupported',
      position,
    });

    const sassResult = classifyStyleReference(
      'css-at-import',
      position,
      '#{$theme}/reset.css'
    );
    expect(sassResult.importItem?.specifier).toBeNull();
    expect(sassResult.unsupportedSyntax?.position).toEqual(position);

    const lessResult = classifyStyleReference(
      'css-url',
      position,
      '@{assets}/logo.png'
    );
    expect(lessResult.importItem?.specifier).toBeNull();
    expect(lessResult.unsupportedSyntax?.position).toEqual(position);
  });

  it('normalizes bare relative references by prepending ./', () => {
    const result = classifyStyleReference(
      'css-url',
      position,
      'images/icon.png'
    );
    expect(result.importItem).toEqual({
      isTypeOnly: false,
      kind: 'css-url',
      position,
      specifier: './images/icon.png',
    });
    expect(result.unsupportedSyntax).toBeUndefined();
  });

  it('preserves existing ./, ../, and #/ specifiers without alteration', () => {
    const currentResult = classifyStyleReference(
      'css-url',
      position,
      './fonts/inter.woff2'
    );
    expect(currentResult.importItem?.specifier).toBe('./fonts/inter.woff2');

    const parentResult = classifyStyleReference(
      'css-at-import',
      position,
      '../base/theme.css'
    );
    expect(parentResult.importItem?.specifier).toBe('../base/theme.css');

    const aliasResult = classifyStyleReference(
      'css-at-import',
      position,
      '#/_src@shared/_styles/base.css'
    );
    expect(aliasResult.importItem).toEqual({
      isTypeOnly: false,
      kind: 'css-at-import',
      position,
      specifier: '#/_src@shared/_styles/base.css',
    });
    expect(aliasResult.unsupportedSyntax).toBeUndefined();
  });

  it('unquotes double and single quoted strings properly', () => {
    const doubleQuoted = classifyStyleReference(
      'css-at-import',
      position,
      '"styles.css"'
    );
    expect(doubleQuoted.importItem?.specifier).toBe('./styles.css');

    const singleQuoted = classifyStyleReference(
      'css-url',
      position,
      "'styles.css'"
    );
    expect(singleQuoted.importItem?.specifier).toBe('./styles.css');

    const internalQuotes = classifyStyleReference(
      'css-url',
      position,
      'prefix "middle" suffix'
    );
    expect(internalQuotes.importItem?.specifier).toBe(
      './prefix "middle" suffix'
    );

    const mismatchedQuote = classifyStyleReference(
      'css-url',
      position,
      '"styles.css'
    );
    expect(mismatchedQuote.importItem?.specifier).toBe('./"styles.css');
  });
});

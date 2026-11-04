import type { TEffectivePathAlias } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function convertCommonAliases(
  commonAliases: Readonly<Record<string, string>>
): readonly TEffectivePathAlias[] {
  const aliases: TEffectivePathAlias[] = [];

  for (const [key, rawBase] of Object.entries(commonAliases)) {
    const withoutLeadingDot = rawBase.startsWith('./')
      ? rawBase.slice(2)
      : rawBase;

    const baseWithoutTrailingSlash = withoutLeadingDot.endsWith('/')
      ? withoutLeadingDot.slice(0, -1)
      : withoutLeadingDot;

    const normalizedBase =
      baseWithoutTrailingSlash === '' ? '.' : baseWithoutTrailingSlash;

    aliases.push({
      prefix: key,
      source: 'common.aliases',
      targets: [normalizedBase],
    });
  }

  return aliases;
}

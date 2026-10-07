/**
 * Languages the application ships translations for, and how a preference is matched to one.
 *
 * How this file was built:
 *   1. Written by hand: Angular CLI has no generator for constants or plain functions.
 *   2. `LANGUAGES` lists the files in public/i18n/ with their native names (the same three
 *      languages as ng-matero's translate button).
 *   3. `resolveLanguage()` turns the `language` setting (`auto` or a code) and the browser's
 *      preferred languages into one supported code.
 *   4. src/index.html repeats the list, `DEFAULT_LANGUAGE` and the matching in its inline
 *      start-up script (it runs before the application, to set `<html lang>` and the loader
 *      text); src/index.spec.ts fails when they differ.
 *
 * Why: labels are endonyms ("简体中文", not "Simplified Chinese") so people can find their own
 * language whatever the current one is. Matching goes through `Intl.Locale#maximize()`, so tags
 * the browser reports but we do not ship map to the closest translation: `zh-HK` and `zh-Hant`
 * use the Traditional Chinese file, `zh-SG` and `zh` the Simplified one, `en-GB` the English one.
 * ng-matero only accepted an exact `navigator.language` match.
 */

export interface LanguageOption {
  /** BCP 47 tag; also the translation file name (`public/i18n/<code>.json`) and `<html lang>`. */
  readonly code: string;
  /** Native name of the language, shown untranslated. */
  readonly label: string;
}

export const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
] as const satisfies readonly LanguageOption[];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

/** Used when no preference matches; also the fallback for keys missing in another language. */
export const DEFAULT_LANGUAGE: LanguageCode = 'en-US';

/**
 * Returns the supported language for a `language` setting: the setting itself when it names a
 * supported language, otherwise (`auto`, or a code that is no longer shipped) the best match for
 * the browser's preferred languages, in order, and finally `DEFAULT_LANGUAGE`.
 */
export function resolveLanguage(setting: string, preferred: readonly string[]): LanguageCode {
  const requested = setting === 'auto' ? preferred : [setting, ...preferred];
  for (const tag of requested) {
    const match = matchLanguage(tag);
    if (match) {
      return match;
    }
  }
  return DEFAULT_LANGUAGE;
}

const supported = LANGUAGES.map(({ code }) => ({ code, locale: new Intl.Locale(code).maximize() }));

/** Same language, script and region first; then the same script (zh-HK → zh-TW); then language. */
function matchLanguage(tag: string): LanguageCode | undefined {
  let wanted: Intl.Locale;
  try {
    wanted = new Intl.Locale(tag).maximize();
  } catch {
    return undefined; // Not a well-formed language tag.
  }
  const sameLanguage = supported.filter(({ locale }) => locale.language === wanted.language);
  return (
    sameLanguage.find(({ locale }) => locale.baseName === wanted.baseName) ??
    sameLanguage.find(({ locale }) => locale.script === wanted.script) ??
    sameLanguage[0]
  )?.code;
}

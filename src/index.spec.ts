/**
 * Tests of the inline start-up scripts of src/index.html against the application code they copy.
 *
 * How this file was built: written by hand. index.html is imported as text (`loader: 'text'`,
 * typed by src/text-imports.d.ts); each inline `<script>` runs through `new Function()` with fake
 * `localStorage`, `navigator` and `document` objects.
 *
 * Why: the scripts must run before the application, so they repeat its storage key, default
 * settings, language list and matching, and the loader text of public/i18n. Comments alone did
 * not keep such copies in sync; these tests fail as soon as one of them drifts.
 */
import enUS from '../public/i18n/en-US.json';
import zhCN from '../public/i18n/zh-CN.json';
import zhTW from '../public/i18n/zh-TW.json';
import { DEFAULT_LANGUAGE, LANGUAGES, resolveLanguage } from './app/core/i18n/languages';
import { defaultAppSettings } from './app/core/settings/app-settings';
import { SETTINGS_STORAGE_KEY } from './app/core/settings/settings-store';
import html from './index.html' with { loader: 'text' };

const [startUp, loaderText] = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), m => m[1]);

interface Root {
  lang: string;
  dir: string;
  classes: string[];
}

/** Runs the start-up script (Step 1) and returns what it set on `<html>`. */
function start(stored: string | null, languages?: readonly string[], storage = true) {
  const root: Root = { lang: '', dir: '', classes: [] };
  const keys: string[] = [];
  const localStorage = {
    getItem(key: string) {
      keys.push(key);
      if (!storage) {
        throw new Error('Storage is blocked');
      }
      return stored;
    },
  };
  const documentElement = {
    ...root,
    classList: { add: (name: string) => root.classes.push(name) },
  };
  new Function('localStorage', 'navigator', 'document', startUp)(
    localStorage,
    { languages },
    { documentElement }
  );
  return { lang: documentElement.lang, dir: documentElement.dir, classes: root.classes, keys };
}

describe('src/index.html', () => {
  it('should read the settings key of SettingsStore and default to its settings', () => {
    const { lang, dir, classes, keys } = start(null, []);

    expect(keys).toEqual([SETTINGS_STORAGE_KEY]);
    expect(dir).toBe(defaultAppSettings.dir);
    expect(classes).toEqual(
      defaultAppSettings.theme === 'light' ? [] : [`theme-${defaultAppSettings.theme}`]
    );
    expect(lang).toBe(resolveLanguage(defaultAppSettings.language, []));
  });

  it('should apply a stored theme and direction, and ignore invalid or unreadable ones', () => {
    const stored = start(JSON.stringify({ theme: 'dark', dir: 'rtl' }));
    expect([stored.classes, stored.dir]).toEqual([['theme-dark'], 'rtl']);

    for (const value of ['{"theme":"blue","dir":"up"}', 'not json', '5', 'null', '"text"']) {
      expect(start(value, [])).toMatchObject({ classes: ['theme-auto'], dir: 'ltr' });
    }
    expect(start('{"dir":"rtl"}', [], false)).toMatchObject({ dir: defaultAppSettings.dir });
  });

  it('should choose the language like resolveLanguage()', () => {
    const settings = [undefined, 'auto', 'en-US', 'zh-CN', 'zh-TW', 'zh-HK', 'fr', 'x?', 7, ''];
    const browsers = [
      undefined,
      [],
      ['en-GB'],
      ['zh-HK', 'en-US'],
      ['zh-Hant-TW'],
      ['zh-SG'],
      ['zh'],
      ['fr-FR', 'zh-CN'],
      ['de', 'ja'],
      ['not a tag', 'zh-TW'],
    ];
    for (const language of settings) {
      for (const browser of browsers) {
        const stored = JSON.stringify(language === undefined ? {} : { language });
        const setting = typeof language === 'string' ? language : defaultAppSettings.language;

        expect(start(stored, browser).lang, `${stored} with ${browser}`).toBe(
          resolveLanguage(setting, browser ?? [])
        );
      }
    }
  });

  it('should show the loader text of public/i18n in the chosen language', () => {
    const translations: Record<string, { layout: { starting: string } }> = {
      'en-US': enUS,
      'zh-CN': zhCN,
      'zh-TW': zhTW,
    };
    expect(Object.keys(translations).sort()).toEqual(LANGUAGES.map(({ code }) => code).sort());
    expect(html).toContain(
      `<p class="global-loader-text" dir="auto" lang="${DEFAULT_LANGUAGE}">${translations[DEFAULT_LANGUAGE].layout.starting}</p>`
    );

    for (const { code } of LANGUAGES) {
      const element = { textContent: 'default', lang: 'default' };
      new Function('document', loaderText)({
        documentElement: { lang: code },
        querySelector: () => element,
      });

      expect(element).toEqual(
        code === DEFAULT_LANGUAGE
          ? { textContent: 'default', lang: 'default' }
          : { textContent: translations[code].layout.starting, lang: code }
      );
    }
  });
});

/**
 * Applies the `language` setting: picks the translation, loads it and sets `<html lang>`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/i18n/language-store` generated an empty `@Service()` class and its
 *      spec.
 *   2. Added `current`, a `computed()` that resolves the `language` setting of `SettingsStore`
 *      (`auto` → the browser's preferred languages, re-read on `languagechange`) to a code of
 *      `LANGUAGES`.
 *   3. Added an `effect()` that hands every new `current` value to `TranslateService.use()` and,
 *      once its translations are loaded, to `<html lang>`; plus `load()`, which the app
 *      initializer of `provideI18n()` awaits. The effect tracks only `current`: the library call
 *      runs in `untracked()` on purpose (see the comment on the effect).
 *   4. Handled a file that fails to load: the previous language stays, `<html lang>` names the
 *      language that is shown, and the next attempt downloads the file again.
 *
 * Why: the language is derived state, not a second copy of the setting: the translate button only
 * calls `SettingsStore.update({ language })` and everything else follows. `<html lang>` tells
 * screen readers which pronunciation to use and lets the browser pick fonts and hyphenation
 * (WCAG 3.1.1). ng-matero switched languages imperatively and never updated `<html lang>`.
 */
import {
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Service,
  signal,
  untracked,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { SettingsStore } from '../settings/settings-store';
import { LanguageCode, LANGUAGES, resolveLanguage } from './languages';

@Service()
export class LanguageStore {
  readonly #document = inject(DOCUMENT);
  readonly #translate = inject(TranslateService);
  readonly #settings = inject(SettingsStore);

  readonly #browserLanguages = signal(this.#readBrowserLanguages());

  /** The last language handed to ngx-translate and its pending load (requested only once). */
  #applied: { lang: LanguageCode; loaded: Promise<void> } | null = null;

  /** Languages the user can choose from (code + native label). */
  readonly languages = LANGUAGES;

  /** The language in effect: the setting, with `auto` resolved from the browser preferences. */
  readonly current = computed(() =>
    resolveLanguage(this.#settings.options().language, this.#browserLanguages())
  );

  constructor() {
    this.#translate.addLangs(LANGUAGES.map(({ code }) => code));

    // Browsers fire `languagechange` when the user reorders their preferred languages.
    const view = this.#document.defaultView;
    const onLanguageChange = () => this.#browserLanguages.set(this.#readBrowserLanguages());
    view?.addEventListener('languagechange', onLanguageChange);
    inject(DestroyRef).onDestroy(() =>
      view?.removeEventListener('languagechange', onLanguageChange)
    );

    // `use()` reads and writes ngx-translate's own signals (current language, loaded
    // translations, pending loads). Calling it untracked keeps the effect subscribed to the
    // setting alone, instead of re-running whenever the library updates its internal state.
    effect(() => {
      const lang = this.current();
      untracked(() => void this.#apply(lang));
    });
  }

  /**
   * Loads the current language. Resolves (never rejects) once its translations are available, or
   * once loading has failed and the previous language stays in effect, so the app initializer can
   * hold the first render until texts are ready without blocking start-up when a file is missing.
   */
  load(): Promise<void> {
    return this.#apply(this.current());
  }

  #apply(lang: LanguageCode): Promise<void> {
    if (this.#applied?.lang === lang) {
      return this.#applied.loaded;
    }
    const loaded = firstValueFrom(this.#translate.use(lang)).then(
      () => {
        // A newer choice may have superseded this one while its file was loading.
        if (this.#applied?.lang === lang) {
          this.#document.documentElement.lang = lang;
        }
      },
      () => {
        // The file could not be loaded (`failOnError` in provide-i18n.ts). ngx-translate logged
        // the failure and kept the previous language; on start-up there is none, and the
        // fallback language's texts are shown. Point <html lang> at the language that is shown,
        // and forget this attempt so that the next `load()`, or the next switch back to this
        // language, downloads the file again.
        if (this.#applied?.lang === lang) {
          this.#applied = null;
          const shown = this.#translate.getCurrentLang() ?? this.#translate.getFallbackLang();
          if (shown) {
            this.#document.documentElement.lang = shown;
          }
        }
      }
    );
    this.#applied = { lang, loaded };
    return loaded;
  }

  #readBrowserLanguages(): readonly string[] {
    return this.#document.defaultView?.navigator.languages ?? [];
  }
}

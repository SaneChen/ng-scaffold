/**
 * `provideI18n()`: everything the application needs for runtime translations, in one provider.
 *
 * How this file was built:
 *   1. `yarn add @ngx-translate/core@^18.0.0 @ngx-translate/http-loader@^18.0.0` (the versions
 *      ng-matero uses, built for Angular 22).
 *   2. Written by hand (Angular CLI has no generator for provider functions), following the
 *      `provideX()` pattern of Angular's own APIs (`provideRouter`, `provideHttpClient`).
 *   3. Registered in app.config.ts as `provideI18n()`.
 *
 * Why:
 *   - Translation files are static assets (public/i18n/<code>.json, served next to index.html).
 *     The loader uses `HttpBackend` directly so they bypass the application's HTTP interceptors
 *     (API base URL, auth token, response unwrapping, error toasts) that only make sense for API
 *     calls. Relative paths keep working when the app is deployed under a sub-path (`<base href>`).
 *   - `failOnError: true`: a file that cannot be loaded fails the load of its language. The
 *     loader's default would silently use `{}` instead and switch to a language without texts.
 *     Failing keeps the previous language (English on start-up) and lets `LanguageStore` keep
 *     `<html lang>` on the language that is actually shown.
 *   - English is the fallback language, so a key missing in another file shows English text
 *     instead of the raw key.
 *   - The app initializer holds the first render until both the current language and the English
 *     fallback are loaded, so users never see untranslated keys flash on start-up. A file that
 *     fails to load never blocks start-up.
 */
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { LanguageStore } from './language-store';
import { DEFAULT_LANGUAGE } from './languages';

export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: 'i18n/',
        suffix: '.json',
        useHttpBackend: true,
        failOnError: true,
      }),
      fallbackLang: DEFAULT_LANGUAGE,
    }),
    provideAppInitializer(() => {
      // `fallbackLang` above already started loading English. `setFallbackLang()` returns that
      // pending load (ngx-translate shares loads in flight), so this waits without a second
      // request. Its failure is logged by ngx-translate; the current language is still shown.
      const fallbackLoaded = firstValueFrom(
        inject(TranslateService).setFallbackLang(DEFAULT_LANGUAGE)
      ).catch(() => undefined);
      return Promise.all([inject(LanguageStore).load(), fallbackLoaded]);
    }),
  ]);
}

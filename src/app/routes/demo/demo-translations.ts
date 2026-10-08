/**
 * Translations of the demo pages, loaded with the first demo area the user opens.
 *
 * How this file was built: written by hand (route providers and a guard; Angular CLI generates
 * neither as a pair).
 *   1. `provideDemoTranslations()`: route providers with an ngx-translate child service whose
 *      loader reads public/i18n/demo/<lang>.json. Pages below the route resolve demo keys there
 *      and every other key (menu, header…) through the root service; the child follows the root's
 *      language, loading its own file for each new language.
 *   2. `demoTranslationsReady`: a `canActivate` guard that waits until the child has loaded the
 *      current language, so a demo page never shows raw keys on its first render.
 *
 * Why: the demo pages translate all their texts (several hundred keys). Keeping them out of
 * public/i18n/<lang>.json keeps the starter's start-up download small, and `ng add` simply does
 * not ship this folder and the demo files.
 */
import { inject, Provider } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { provideChildTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

/** Route providers of every demo area: `{ path: '', providers: provideDemoTranslations(), … }`. */
export function provideDemoTranslations(): Provider[] {
  return provideChildTranslateService({
    loader: provideTranslateHttpLoader({
      prefix: 'i18n/demo/',
      suffix: '.json',
      useHttpBackend: true,
      failOnError: true,
    }),
  });
}

/** Waits for the demo translations of the current language (`get()` waits for a pending load). */
export const demoTranslationsReady: CanActivateFn = async () => {
  const translate = inject(TranslateService);
  const router = inject(Router);
  const language = translate.getCurrentLang();
  if (!language) return router.createUrlTree(['/500']);
  try {
    const dictionary = translate.getTranslations(language);
    if (!translate.isLoading() && (!dictionary || !Object.hasOwn(dictionary, 'demo'))) {
      await firstValueFrom(translate.reloadLang(language));
    }
    const demo: unknown = await firstValueFrom(translate.get('demo'));
    if (typeof demo !== 'object' || demo === null || Object.keys(demo).length === 0) {
      throw new Error('Demo translations missing');
    }
    return true;
  } catch {
    if (language) translate.resetLang(language);
    return router.createUrlTree(['/500']);
  }
};

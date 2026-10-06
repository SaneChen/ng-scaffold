import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// [ng-scaffold] Step 1: layout settings (stored preferences, <html> dir/theme, CDK direction).
import { Directionality } from '@angular/cdk/bidi';
import { inject, provideAppInitializer } from '@angular/core';
import { AppDirectionality, SettingsStore } from '@core';
// [ng-scaffold] Step 2: runtime translations (ngx-translate) and translated paginator labels.
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PaginatorIntl, provideI18n } from '@core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // [ng-scaffold] Step 1: create SettingsStore during start-up so the stored direction and theme
    // reach <html> before the first render, and make CDK/Material components follow `dir`.
    provideAppInitializer(() => {
      inject(SettingsStore);
    }),
    { provide: Directionality, useExisting: AppDirectionality },
    // [ng-scaffold] Step 2: load public/i18n/<language>.json before the first render and keep the
    // translation, <html lang> and the MatPaginator labels in sync with the `language` setting.
    provideI18n(),
    { provide: MatPaginatorIntl, useClass: PaginatorIntl },
    provideRouter(routes),
  ],
};

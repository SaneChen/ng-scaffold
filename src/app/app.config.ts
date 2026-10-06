import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// [ng-scaffold] Step 1: layout settings (stored preferences, <html> dir/theme, CDK direction).
import { Directionality } from '@angular/cdk/bidi';
import { inject, provideAppInitializer } from '@angular/core';
import { AppDirectionality, SettingsStore } from '@core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // [ng-scaffold] Step 1: create SettingsStore during start-up so the stored direction and theme
    // reach <html> before the first render, and make CDK/Material components follow `dir`.
    provideAppInitializer(() => {
      inject(SettingsStore);
    }),
    { provide: Directionality, useExisting: AppDirectionality },
    provideRouter(routes),
  ],
};

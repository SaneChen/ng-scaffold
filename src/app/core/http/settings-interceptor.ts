/**
 * `settingsInterceptor`: tells the API which language the user reads (`Accept-Language`).
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/settings` generated a functional `HttpInterceptorFn` and
 *      its spec.
 *   2. Sets `Accept-Language` on API requests to `LanguageStore.current()` (the resolved language,
 *      never `auto`).
 *
 * Why: server messages (validation errors, toasts built from `msg`) come back in the language of
 * the interface. `set` instead of ng-matero's `append`, so an explicit header of the caller is
 * replaced rather than duplicated.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageStore } from '../i18n/language-store';
import { API_BASE_URL, isApiUrl } from './api-url';

export const settingsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url, inject(API_BASE_URL))) {
    return next(req);
  }
  const language = inject(LanguageStore).current();
  return next(req.clone({ setHeaders: { 'Accept-Language': language } }));
};

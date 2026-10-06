/**
 * `baseUrlInterceptor`: sends relative API requests to `environment.baseUrl`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/base-url` generated a functional `HttpInterceptorFn` and
 *      its spec.
 *   2. Prefixes the URL with `API_BASE_URL` when `isApiUrl()` accepts it (not a static asset, not
 *      absolute).
 *
 * Why: services call `/user`, `/auth/login`… and stay independent of where the backend runs.
 * ng-matero also prefixed `i18n/*.json` and `data/*.json`, which broke them as soon as the API
 * lived on another host.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL, isApiUrl, withBaseUrl } from './api-url';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!baseUrl || !isApiUrl(req.url, baseUrl)) {
    return next(req);
  }
  return next(req.clone({ url: withBaseUrl(req.url, baseUrl) }));
};

/**
 * What counts as an API request, and the API base URL the HTTP interceptors work with.
 *
 * How this file was built: written by hand (constants and plain functions; Angular CLI has no
 * generator for them) as the one rule every interceptor of this folder applies.
 *
 * Why: the interceptors must touch backend calls only. Static assets served next to index.html
 * (`i18n/`, `data/`, `images/`, requested with relative paths) and third-party URLs must get no
 * base URL, no `Authorization` header and no envelope unwrapping. ng-matero let each interceptor
 * decide on its own (`/api/` substring, scheme checks), which disagreed between interceptors.
 */
import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { environment } from '@env/environment';

/** Prefix of relative API URLs; `environment.baseUrl` unless a test or app provides another. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.baseUrl,
});

/** Relative paths of static assets deployed with the application (public/). */
export const STATIC_ASSET_PATHS: readonly string[] = ['i18n/', 'data/', 'images/'];

/**
 * Set to `false` on a request whose errors the caller presents itself (a form showing field
 * errors), so `errorInterceptor` neither toasts nor navigates.
 */
export const HANDLE_HTTP_ERRORS = new HttpContextToken<boolean>(() => true);

/**
 * Set to `true` on the token refresh request: `tokenInterceptor` must not hold it back waiting for
 * a refresh (itself), and `AuthStore` handles its 401.
 */
export const IS_TOKEN_REFRESH = new HttpContextToken<boolean>(() => false);

/** Whether `url` (before or after `withBaseUrl`) addresses the application's API. */
export function isApiUrl(url: string, baseUrl: string): boolean {
  if (isAbsolute(url)) {
    const base = baseUrl.replace(/\/+$/, '');
    return isAbsolute(base) && startsWithPath(url, base);
  }
  const path = url.replace(/^\.?\/+/, '');
  return !STATIC_ASSET_PATHS.some(prefix => path.startsWith(prefix));
}

/** Prefixes a relative API URL with `baseUrl` (`/user` + `https://api.example.com/v1`). */
export function withBaseUrl(url: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  // Absolute URLs, and paths that already carry a relative base (`/api/user` for `/api`).
  if (!base || isAbsolute(url) || startsWithPath(url, base)) {
    return url;
  }
  return `${base}/${url.replace(/^\.?\/+/, '')}`;
}

/** Whether `url` is `base` or below it (`/api/x` is below `/api`, `/apiary` is not). */
export function startsWithPath(url: string, base: string): boolean {
  // Scheme and host are case-insensitive; paths rarely differ only by case.
  return (
    url.toLowerCase().startsWith(base.toLowerCase()) && /^($|[/?#])/.test(url.slice(base.length))
  );
}

/** `https://…`, `data:…` or protocol-relative `//host/…`. */
function isAbsolute(url: string): boolean {
  return /^([a-z][a-z\d+.-]*:|\/\/)/i.test(url);
}

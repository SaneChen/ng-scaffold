/**
 * `tokenInterceptor`: authenticates API requests and signs out when the API rejects the token.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/token` generated a functional `HttpInterceptorFn` and its
 *      spec.
 *   2. Adds `Authorization: <scheme> <token>` from `TokenStore` to API requests only.
 *   3. A 401 answer to a request that carried the token clears `TokenStore`; `AuthStore` then
 *      shows the login page (with `returnUrl`).
 *   4. A request made while the access token has expired but can still be refreshed (a restored
 *      "remember me" session) waits for `AuthStore.refresh()` and is sent with the new token,
 *      instead of being rejected with 401 and signing the user out.
 *
 * Why: the token must never leak to third-party hosts (`isApiUrl()`). ng-matero also navigated
 * from here (to /dashboard after any request made on the login page, to the login page after
 * /auth/logout) and forced `withCredentials`, which a bearer token does not need.
 */
import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, defer, from, Observable, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { AuthToken } from '../auth/auth-token';
import { TokenStore } from '../auth/token-store';
import { API_BASE_URL, IS_TOKEN_REFRESH, isApiUrl } from './api-url';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStore);
  const token = tokens.token();
  if (!token || !isApiUrl(req.url, inject(API_BASE_URL))) {
    return next(req);
  }
  if (!token.valid() && token.refreshable && !req.context.get(IS_TOKEN_REFRESH)) {
    const auth = inject(AuthStore);
    return from(auth.refresh()).pipe(
      switchMap(() => {
        const renewed = tokens.token();
        return renewed ? send(renewed) : next(req);
      })
    );
  }
  return send(token);

  function send(current: AuthToken): Observable<HttpEvent<unknown>> {
    return defer(() =>
      next(req.clone({ setHeaders: { Authorization: current.authorizationHeader } }))
    ).pipe(
      catchError((error: unknown) => {
        // Only if the rejected token is still the current one (not already refreshed or replaced).
        if (
          error instanceof HttpErrorResponse &&
          error.status === HttpStatusCode.Unauthorized &&
          tokens.token() === current
        ) {
          tokens.clear();
        }
        return throwError(() => error);
      })
    );
  }
};

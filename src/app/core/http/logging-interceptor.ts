/**
 * `loggingInterceptor`: logs every HTTP request with its outcome and duration in development.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/logging` generated a functional `HttpInterceptorFn` and
 *      its spec.
 *   2. Outside dev mode (`isDevMode()` is false in production builds) it only forwards the
 *      request; in dev mode it writes `GET "/user" 200 in 12 ms` to `console.debug`.
 *
 * Why: a cheap trace of the API traffic while developing against the mock API. ng-matero pushed
 * the lines into an unused `MessageService` array; the browser console is where developers look.
 */
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { finalize, tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isDevMode()) {
    return next(req);
  }
  const started = performance.now();
  let outcome = 'cancelled';
  return next(req).pipe(
    tap({
      next: event => {
        if (event instanceof HttpResponse) {
          outcome = String(event.status);
        }
      },
      error: (error: unknown) => {
        outcome = error instanceof HttpErrorResponse ? `failed (${error.status})` : 'failed';
      },
    }),
    finalize(() => {
      const elapsed = Math.round(performance.now() - started);
      console.debug(`${req.method} "${req.urlWithParams}" ${outcome} in ${elapsed} ms`);
    })
  );
};

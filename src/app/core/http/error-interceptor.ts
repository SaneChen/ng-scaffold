/**
 * `errorInterceptor`: reports failed API requests to the user.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/error` generated a functional `HttpInterceptorFn` and its
 *      spec.
 *   2. For failed API requests (unless the caller set `HANDLE_HTTP_ERRORS` to false):
 *      - a GET answered with 403, 404 or 500 shows that error page (`skipLocationChange`, so the
 *        address bar keeps the URL the user asked for, as in ng-matero);
 *      - 422 (validation) is left to the form that sent it;
 *      - everything else shows an error toast: a translated text for 401 (`http.unauthorized`)
 *        and for an unreachable server (`http.network_error`); otherwise the server's
 *        `message`/`msg`, or `http.error` with the status.
 *   3. The error is always rethrown, so callers can still react.
 *
 * Why: ng-matero navigated to an error page for any method, so a failed save threw the user out
 * of a form and lost the input, and its messages were untranslated status texts.
 */
import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { Toaster } from '../toast/toaster';
import { API_BASE_URL, HANDLE_HTTP_ERRORS, isApiUrl } from './api-url';

/** Statuses that replace the page with an error page when they answer a GET. */
export const ERROR_PAGE_STATUSES: readonly number[] = [
  HttpStatusCode.Forbidden,
  HttpStatusCode.NotFound,
  HttpStatusCode.InternalServerError,
];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(HANDLE_HTTP_ERRORS) || !isApiUrl(req.url, inject(API_BASE_URL))) {
    return next(req);
  }
  const router = inject(Router);
  const toast = inject(Toaster);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (req.method === 'GET' && ERROR_PAGE_STATUSES.includes(error.status)) {
          void router.navigateByUrl(`/${error.status}`, { skipLocationChange: true });
        } else if (error.status !== HttpStatusCode.UnprocessableEntity) {
          // The client words these two itself: a server's text for them is rarely helpful.
          const own = error.status === 0 || error.status === HttpStatusCode.Unauthorized;
          toast.error(
            (own ? undefined : serverMessage(error)) ??
              translate.instant(messageKey(error), { status: error.status })
          );
        }
      }
      return throwError(() => error);
    })
  );
};

function serverMessage(error: HttpErrorResponse): string | undefined {
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const { message, msg } = body as { message?: unknown; msg?: unknown };
  const text = message ?? msg;
  return typeof text === 'string' && text !== '' ? text : undefined;
}

function messageKey(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'http.network_error';
  }
  return error.status === HttpStatusCode.Unauthorized ? 'http.unauthorized' : 'http.error';
}

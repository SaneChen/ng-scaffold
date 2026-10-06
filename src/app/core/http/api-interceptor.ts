/**
 * `apiInterceptor`: unwraps the `{ code, msg, data }` envelope of API responses.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/api` generated a functional `HttpInterceptorFn` and its
 *      spec.
 *   2. For API responses whose body is an envelope (`code` is a number, plus `msg` or `data`):
 *      `code === 0` replaces the body with `data`; any other code shows `msg` as an error toast and
 *      fails the request with an `ApiError` (no toast for callers that opted out with
 *      `HANDLE_HTTP_ERRORS`).
 *
 * Why: backends that report failures inside HTTP 200 responses (common with this envelope) would
 * otherwise reach components as successful values. ng-matero only checked URLs containing `/api/`,
 * failed with an empty array instead of an error, and left `data` wrapped on success. Bodies that
 * are not envelopes pass through untouched, so plain REST endpoints (and the mock API) work too.
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { Toaster } from '../toast/toaster';
import { API_BASE_URL, HANDLE_HTTP_ERRORS, isApiUrl } from './api-url';

/** Response envelope: `code` 0 means success. */
export interface ApiEnvelope<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
}

/** A request the API answered with a non-zero envelope `code`. */
export class ApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly response: HttpResponse<unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url, inject(API_BASE_URL))) {
    return next(req);
  }
  const toast = inject(Toaster);
  return next(req).pipe(
    map(event => {
      if (!(event instanceof HttpResponse) || !isEnvelope(event.body)) {
        return event;
      }
      const { code, msg, data } = event.body;
      if (code !== 0) {
        if (msg && req.context.get(HANDLE_HTTP_ERRORS)) {
          toast.error(msg);
        }
        throw new ApiError(code, msg ?? `API error ${code}`, event);
      }
      return event.clone({ body: data ?? null });
    })
  );
};

function isEnvelope(body: unknown): body is ApiEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Partial<ApiEnvelope>).code === 'number' &&
    ('msg' in body || 'data' in body)
  );
}

/**
 * `mockApiInterceptor`: answers the API from memory while `environment.mockApi` is true.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/mock/mock-api` generated a functional `HttpInterceptorFn` and
 *      its spec.
 *   2. Requests the `MockBackend` implements are answered after `MOCK_API_LATENCY` ms, as an
 *      `HttpResponse` or an `HttpErrorResponse`; everything else continues to the network.
 *   3. `GET /user/menu` (signed in) is served from the static asset `data/menu.json`.
 *   4. Registered last in `httpInterceptors` (core/http/interceptors.ts), only when
 *      `environment.mockApi` is true.
 *
 * Why last: it stands in for the server, so it must receive what the server would — the final URL
 * and the `Authorization` header — and its answers must pass every other interceptor (token 401
 * handling, envelope unwrapping, error toasts, logging) exactly like real ones.
 */
import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { delay, map, Observable, of, throwError, timer, mergeMap } from 'rxjs';
import { API_BASE_URL, isApiUrl, startsWithPath } from '../http/api-url';
import { MockBackend, MockResponse } from './mock-backend';

/** Simulated network latency of mock answers, in milliseconds. */
export const MOCK_API_LATENCY = new InjectionToken<number>('MOCK_API_LATENCY', {
  providedIn: 'root',
  factory: () => 300,
});

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!isApiUrl(req.url, baseUrl)) {
    return next(req);
  }
  const backend = inject(MockBackend);
  const latency = inject(MOCK_API_LATENCY);
  const path = apiPath(req.url, baseUrl);

  if (req.method === 'GET' && path === '/user/menu') {
    if (!backend.authenticate(req)) {
      return respond({ status: HttpStatusCode.Unauthorized, body: {} }, req.url, latency);
    }
    return next(
      req.clone({ url: 'data/menu.json', headers: req.headers.delete('Authorization') })
    ).pipe(
      map(event =>
        event instanceof HttpResponse ? event.clone({ url: req.urlWithParams }) : event
      ),
      delay(latency)
    );
  }

  const answer = backend.handle(req, path);
  return answer ? respond(answer, req.urlWithParams, latency) : next(req);
};

function respond(
  { status, body }: MockResponse,
  url: string,
  latency: number
): Observable<HttpEvent<unknown>> {
  if (status >= 200 && status < 300) {
    return of(new HttpResponse({ status, body, url })).pipe(delay(latency));
  }
  return timer(latency).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: body, url })))
  );
}

/** The request path relative to the API root: `https://api.example.com/v1/user?x=1` -> `/user`. */
export function apiPath(url: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const relative = base && startsWithPath(url, base) ? url.slice(base.length) : url;
  const path = relative.split(/[?#]/)[0].replace(/^\.?\/*/, '/');
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

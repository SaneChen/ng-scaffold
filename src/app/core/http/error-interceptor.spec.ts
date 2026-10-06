/**
 * Unit tests for `errorInterceptor`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/error` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient`: error pages for failed GETs, toasts for
 *      other methods and statuses (server message, translated fallback, network error), silence
 *      for 422 and for requests that opt out, and the error always reaching the caller.
 *      `Toaster` is a spy; translations are in memory.
 */
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { HANDLE_HTTP_ERRORS } from './api-url';
import { Toaster } from '../toast/toaster';
import { errorInterceptor } from './error-interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  const toast = { error: vi.fn() };

  beforeEach(() => {
    toast.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Toaster, useValue: toast },
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en-US', {
      http: {
        error: 'Request failed ({{status}})',
        network_error: 'Cannot reach the server.',
        unauthorized: 'Your session has ended.',
      },
    });
    translate.use('en-US');
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => backend.verify());

  function fail(
    method: 'GET' | 'POST',
    status: number,
    body: object | null = null,
    context?: HttpContext
  ): unknown {
    let error: unknown;
    const request =
      method === 'GET' ? http.get('/items', { context }) : http.post('/items', {}, { context });
    request.subscribe({ error: (e: unknown) => (error = e) });
    const req = backend.expectOne('/items');
    if (status === 0) {
      req.error(new ProgressEvent('error'));
    } else {
      req.flush(body, { status, statusText: 'Error' });
    }
    return error;
  }

  it('should show the error page of a failed GET without changing the address', () => {
    for (const status of [403, 404, 500]) {
      fail('GET', status);
      expect(navigate).toHaveBeenLastCalledWith(`/${status}`, { skipLocationChange: true });
    }
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should keep the user on the page and toast when a save fails', () => {
    fail('POST', 500, { message: 'Database is read-only' });

    expect(navigate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Database is read-only');
  });

  it('should toast a translated message when the server sends none, and always for 401', () => {
    fail('GET', 409);
    fail('GET', 401, { message: 'Unauthenticated.' });
    fail('GET', 0);

    expect(toast.error.mock.calls).toEqual([
      ['Request failed (409)'],
      ['Your session has ended.'],
      ['Cannot reach the server.'],
    ]);
  });

  it('should leave validation errors and opted-out requests to the caller', () => {
    const error = fail('POST', 422, { errors: { name: ['Required'] } });
    fail('GET', 404, null, new HttpContext().set(HANDLE_HTTP_ERRORS, false));

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(toast.error).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});

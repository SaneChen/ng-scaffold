/**
 * Unit tests for `apiInterceptor`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/api` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient`: a success envelope is unwrapped, a failure
 *      envelope toasts `msg` and errors with `ApiError`, plain bodies and static assets pass
 *      through; callers that opted out with `HANDLE_HTTP_ERRORS` get no toast. `Toaster` is a spy.
 */
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Toaster } from '../toast/toaster';
import { ApiError, apiInterceptor } from './api-interceptor';
import { HANDLE_HTTP_ERRORS } from './api-url';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const toast = { error: vi.fn() };

  beforeEach(() => {
    toast.error.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: Toaster, useValue: toast },
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('should unwrap the data of a success envelope', () => {
    let result: unknown;
    http.get('/user').subscribe(value => (result = value));

    backend.expectOne('/user').flush({ code: 0, msg: 'ok', data: { id: 1 } });

    expect(result).toEqual({ id: 1 });
  });

  it('should fail a request with a non-zero code and show its message', () => {
    let error: unknown;
    http.get('/user').subscribe({ error: (e: unknown) => (error = e) });

    backend.expectOne('/user').flush({ code: 40001, msg: 'Quota exceeded' });

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(40001);
    expect(toast.error).toHaveBeenCalledWith('Quota exceeded');
  });

  it('should not toast for callers that present their own errors', () => {
    let error: unknown;
    http
      .get('/user', { context: new HttpContext().set(HANDLE_HTTP_ERRORS, false) })
      .subscribe({ error: (e: unknown) => (error = e) });

    backend.expectOne('/user').flush({ code: 1, msg: 'No' });

    expect(error).toBeInstanceOf(ApiError);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should pass through bodies that are not envelopes and static assets', () => {
    const values: unknown[] = [];
    http.get('/user').subscribe(value => values.push(value));
    http.get('data/menu.json').subscribe(value => values.push(value));

    backend.expectOne('/user').flush({ code: 'NL', name: 'Netherlands' });
    backend.expectOne('data/menu.json').flush({ code: 1, data: [] });

    expect(values).toEqual([
      { code: 'NL', name: 'Netherlands' },
      { code: 1, data: [] },
    ]);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

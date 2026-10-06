/**
 * Unit tests for `loggingInterceptor`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/logging` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient` that check the logged line for a success and
 *      a failure (tests run in dev mode).
 */
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { loggingInterceptor } from './logging-interceptor';

describe('loggingInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let debug: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loggingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    backend.verify();
    vi.restoreAllMocks();
  });

  it('should log the method, URL, status and duration', () => {
    http.get('/user', { params: { full: 1 } }).subscribe();
    backend.expectOne('/user?full=1').flush({});

    expect(debug).toHaveBeenCalledWith(
      expect.stringMatching(/^GET "\/user\?full=1" 200 in \d+ ms$/)
    );
  });

  it('should log failures', () => {
    http.post('/items', {}).subscribe({ error: () => undefined });
    backend.expectOne('/items').flush(null, { status: 503, statusText: 'Unavailable' });

    expect(debug).toHaveBeenCalledWith(expect.stringMatching(/^POST "\/items" failed \(503\)/));
  });
});

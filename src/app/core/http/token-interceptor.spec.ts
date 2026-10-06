/**
 * Unit tests for `tokenInterceptor`.
 *
 * How this file was built:
 *   1. `yarn ng g interceptor core/http/token` generated the "should be created" test.
 *   2. Replaced it with requests through `HttpClient`: the header on API requests only (relative
 *      and base-URL hosts, not third-party hosts or assets), nothing when signed out, and the
 *      token cleared by a 401 unless it was replaced meanwhile, and a request made with an
 *      expired, refreshable token waiting for the refresh (the refresh request itself does not).
 */
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TokenStore } from '../auth/token-store';
import { API_BASE_URL } from './api-url';
import { tokenInterceptor } from './token-interceptor';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let tokens: TokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://api.example.com' },
        provideRouter([]),
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStore);
  });

  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  function authorization(url: string): string | null {
    http.get(url).subscribe();
    const req = backend.expectOne(url);
    req.flush({});
    return req.request.headers.get('Authorization');
  }

  it('should authenticate API requests only', () => {
    tokens.set({ access_token: 'abc' }, false);

    expect(authorization('/user')).toBe('Bearer abc');
    expect(authorization('https://api.example.com/user')).toBe('Bearer abc');
    expect(authorization('https://api.github.com/repos')).toBeNull();
    expect(authorization('data/menu.json')).toBeNull();
  });

  it('should send no header while signed out', () => {
    expect(authorization('/user')).toBeNull();
  });

  it('should clear the token when the API rejects it', () => {
    tokens.set({ access_token: 'abc' }, false);

    http.get('/user').subscribe({ error: () => undefined });
    backend.expectOne('/user').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(tokens.token()).toBeNull();
  });

  it('should keep a token that replaced the rejected one while the request was in flight', () => {
    tokens.set({ access_token: 'old' }, false);
    http.get('/user').subscribe({ error: () => undefined });
    tokens.set({ access_token: 'new' }, false);

    backend.expectOne('/user').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(tokens.token()?.accessToken).toBe('new');
  });

  it('should refresh an expired, refreshable token before sending the request', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    tokens.set({ access_token: 'old', refresh_token: 'r1', expires_in: 60 }, true);
    vi.setSystemTime(Date.now() + 120_000);

    let user: unknown;
    http.get('/user').subscribe(value => (user = value));
    backend.expectNone('/user');

    const refresh = backend.expectOne('/auth/refresh');
    expect(refresh.request.headers.get('Authorization')).toBe('Bearer old');
    refresh.flush({ access_token: 'new', refresh_token: 'r2', expires_in: 60 });

    // AuthStore, created to refresh, loads `/user` for the session as well: every request that
    // went out must carry the new token.
    let requests: TestRequest[] = [];
    await vi.waitFor(() => {
      requests = backend.match('/user');
      expect(requests.length).toBeGreaterThan(0);
    });
    expect(requests.map(req => req.request.headers.get('Authorization'))).toEqual(
      requests.map(() => 'Bearer new')
    );
    requests.forEach(req => req.flush({ id: 1 }));

    expect(user).toEqual({ id: 1 });
    vi.useRealTimers();
  });
});

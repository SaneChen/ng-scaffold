/**
 * Unit tests for `AuthStore`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/auth/auth-store` generated the "should be created" test.
 *   2. Replaced it with tests against `HttpTestingController` and a real router: login (stored
 *      token, user loaded once), a refused login, logout (also when the server fails), the
 *      redirect with `returnUrl` when the token disappears, the scheduled refresh (Vitest fake
 *      timers) and a refused refresh.
 *   3. Added the races found in review: logout while a refresh is in flight, a logout whose token
 *      is rejected meanwhile, a second login over an active session, and tokens so short-lived
 *      that the refresh time is always past.
 */
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthStore } from './auth-store';
import { TokenStore } from './token-store';
import { User } from './user';

@Component({ template: '' })
class Page {}

const USER: User = { id: 1, name: 'Ada', email: 'ada@example.com', roles: ['ADMIN'] };

describe('AuthStore', () => {
  let store: AuthStore;
  let tokens: TokenStore;
  let http: HttpTestingController;
  let router: Router;

  async function setup(url = '/dashboard') {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'auth/login', component: Page },
          { path: 'dashboard', component: Page },
        ]),
      ],
    });
    store = TestBed.inject(AuthStore);
    tokens = TestBed.inject(TokenStore);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await (await RouterTestingHarness.create()).navigateByUrl(url);
  }

  async function signIn(remember = false) {
    const login = store.login('ada', 'secret', remember);
    http.expectOne('/auth/login').flush({ access_token: 'token-1' });
    await login;
    TestBed.tick();
    http.expectOne('/user').flush(USER);
    await TestBed.inject(Router).navigated;
  }

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('should sign in, store the token and load the user', async () => {
    await setup();
    expect(store.isAuthenticated()).toBe(false);

    await signIn(true);

    expect(store.isAuthenticated()).toBe(true);
    expect(tokens.remember).toBe(true);
    expect(store.user()).toEqual(USER);
  });

  it('should reject a refused login and stay signed out', async () => {
    await setup();
    const login = store.login('ada', 'wrong');
    http
      .expectOne('/auth/login')
      .flush({ message: 'Invalid' }, { status: 422, statusText: 'Unprocessable Entity' });

    await expect(login).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('should log out locally even when the server fails, and open the login page', async () => {
    await setup();
    await signIn();

    const logout = store.logout();
    http.expectOne('/auth/logout').flush(null, { status: 500, statusText: 'Server Error' });
    await logout;
    TestBed.tick();
    await vi.waitFor(() => expect(router.url).toBe('/auth/login'));

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
  });

  it('should send the user to the login page with returnUrl when the token is dropped', async () => {
    await setup('/dashboard?tab=2');
    await signIn();

    tokens.clear();
    TestBed.tick();

    await vi.waitFor(() => expect(router.url).toBe('/auth/login?returnUrl=%2Fdashboard%3Ftab%3D2'));
  });

  it('should refresh the token before it expires without reloading the user', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await setup();
    const login = store.login('ada', 'secret');
    http
      .expectOne('/auth/login')
      .flush({ access_token: 'token-1', refresh_token: 'r1', expires_in: 60 });
    await login;
    TestBed.tick();
    http.expectOne('/user').flush(USER);

    vi.advanceTimersByTime(55_000);
    const refresh = http.expectOne('/auth/refresh');
    expect(refresh.request.body).toEqual({ refresh_token: 'r1' });
    refresh.flush({ access_token: 'token-2', refresh_token: 'r2', expires_in: 60 });
    await vi.waitFor(() => expect(tokens.token()?.accessToken).toBe('token-2'));
    TestBed.tick();

    http.expectNone('/user');
    expect(store.user()).toEqual(USER);
  });

  it('should sign out when the refresh is refused', async () => {
    await setup();
    tokens.set({ access_token: 'old', refresh_token: 'r1', expires_in: 60 }, false);
    TestBed.tick();
    http.expectOne('/user').flush(USER);

    const refresh = store.refresh();
    http.expectOne('/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    await refresh;

    expect(store.isAuthenticated()).toBe(false);
  });

  it('should not bring the session back when logout happens during a refresh', async () => {
    await setup();
    tokens.set({ access_token: 'old', refresh_token: 'r1', expires_in: 60 }, false);
    TestBed.tick();
    http.expectOne('/user').flush(USER);

    const refresh = store.refresh();
    const logout = store.logout();
    http.expectOne('/auth/logout').flush({});
    await logout;
    http.expectOne('/auth/refresh').flush({ access_token: 'new', refresh_token: 'r2' });
    await refresh;

    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  it('should drop returnUrl after a logout even when the token is rejected meanwhile', async () => {
    await setup('/dashboard');
    await signIn();

    const logout = store.logout();
    tokens.clear(); // what tokenInterceptor does when /auth/logout answers 401
    http.expectOne('/auth/logout').flush(null, { status: 401, statusText: 'Unauthorized' });
    await logout;
    TestBed.tick();

    await vi.waitFor(() => expect(router.url).toBe('/auth/login'));
  });

  it('should load the new user when another user signs in over an active session', async () => {
    await setup();
    await signIn();

    const register = store.register({ username: 'eve', password: 'pw' });
    http.expectOne('/auth/register').flush({ access_token: 'token-eve' });
    await register;
    TestBed.tick();
    http.expectOne('/user').flush({ ...USER, id: 2, name: 'Eve', roles: ['GUEST'] });
    await vi.waitFor(() => expect(store.user()?.name).toBe('Eve'));
  });

  it('should not refresh in a loop when the refresh time is always past', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await setup();
    tokens.set({ access_token: 'a', refresh_token: 'r', expires_in: 3 }, false);
    TestBed.tick();
    http.expectOne('/user').flush(USER);

    vi.advanceTimersByTime(0);
    http.expectOne('/auth/refresh').flush({ access_token: 'b', refresh_token: 'r', expires_in: 3 });
    // Microtasks only: vi.waitFor() would advance the fake clock.
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    expect(tokens.token()?.accessToken).toBe('b');
    TestBed.tick();

    vi.advanceTimersByTime(9_000);
    http.expectNone('/auth/refresh');
    vi.advanceTimersByTime(1_000);
    http.expectOne('/auth/refresh');
  });
});

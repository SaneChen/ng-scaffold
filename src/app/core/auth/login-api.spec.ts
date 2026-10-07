/**
 * Unit tests for `LoginApi`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/auth/login-api` generated the "should be created" test.
 *   2. Replaced it with one test per endpoint (the menu one added with the menu model) that pins the HTTP contract (method, path, body) the
 *      mock API and a real backend must implement.
 *   3. Added `PATCH /user` with the profile settings page.
 */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HANDLE_HTTP_ERRORS } from '../http/api-url';
import { LoginApi } from './login-api';

describe('LoginApi', () => {
  let api: LoginApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LoginApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should post the credentials to /auth/login', () => {
    api.login({ username: 'u', password: 'p', rememberMe: true }).subscribe();

    const req = http.expectOne({ method: 'POST', url: '/auth/login' });
    expect(req.request.body).toEqual({ username: 'u', password: 'p', rememberMe: true });
  });

  it('should post the new account to /auth/register', () => {
    api.register({ username: 'u', password: 'p', email: 'u@example.com' }).subscribe();

    const req = http.expectOne({ method: 'POST', url: '/auth/register' });
    expect(req.request.body).toEqual({ username: 'u', password: 'p', email: 'u@example.com' });
  });

  it('should post the refresh token to /auth/refresh', () => {
    api.refresh('r1').subscribe();

    expect(http.expectOne({ method: 'POST', url: '/auth/refresh' }).request.body).toEqual({
      refresh_token: 'r1',
    });
  });

  it('should post to /auth/logout and get /user', () => {
    api.logout().subscribe();
    api.user().subscribe();

    http.expectOne({ method: 'POST', url: '/auth/logout' });
    http.expectOne({ method: 'GET', url: '/user' });
  });

  it('should get the menu from /user/menu and unwrap its `menu` property', () => {
    let menu: unknown;
    api.menu().subscribe(value => (menu = value));

    http.expectOne({ method: 'GET', url: '/user/menu' }).flush({ menu: [{ route: 'dashboard' }] });

    expect(menu).toEqual([{ route: 'dashboard' }]);
  });

  it('should patch /user with the profile and leave its errors to the form', () => {
    api.updateUser({ name: 'Ada', email: 'ada@example.com' }).subscribe();

    const req = http.expectOne({ method: 'PATCH', url: '/user' });
    expect(req.request.body).toEqual({ name: 'Ada', email: 'ada@example.com' });
    expect(req.request.context.get(HANDLE_HTTP_ERRORS)).toBe(false);
  });
});

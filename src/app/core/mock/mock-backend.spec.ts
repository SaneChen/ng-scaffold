/**
 * Unit tests for `MockBackend`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/mock/mock-backend` generated the "should be created" test.
 *   2. Replaced it with one test per endpoint, calling `handle()` directly with `HttpRequest`s
 *      and explicit times: login (username or email, wrong password), sign-up (new account,
 *      taken name), refresh (refresh token only, expiry), the current user and unknown routes.
 *   3. Added the profile update (`PATCH /user`).
 */
import { HttpHeaders, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthToken, TokenResponse } from '../auth/auth-token';
import { MOCK_ACCESS_TOKEN_TTL, MockBackend } from './mock-backend';

const NOW = Date.UTC(2026, 0, 1);

describe('MockBackend', () => {
  let backend: MockBackend;

  beforeEach(() => {
    backend = TestBed.inject(MockBackend);
  });

  function post(path: string, body: unknown, now = NOW) {
    return backend.handle(new HttpRequest('POST', path, body), path, now);
  }

  function getUser(token: string, now = NOW) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return backend.handle(new HttpRequest('GET', '/user', { headers }), '/user', now);
  }

  function login(username = 'ng-scaffold'): TokenResponse {
    return post('/auth/login', { username, password: 'ng-scaffold' })?.body as TokenResponse;
  }

  it('should sign in the demo account with an expiring, refreshable JWT', () => {
    const token = AuthToken.fromResponse(login(), NOW);

    expect(token.isJwt).toBe(true);
    expect(token.expiresAt).toBe(NOW + MOCK_ACCESS_TOKEN_TTL * 1000);
    expect(token.refreshable).toBe(true);
    expect(
      post('/auth/login', { username: 'ng-scaffold@example.com', password: 'ng-scaffold' })?.status
    ).toBe(200);
  });

  it('should refuse a wrong password with a validation error', () => {
    expect(post('/auth/login', { username: 'ng-scaffold', password: 'nope' })).toEqual({
      status: 422,
      body: expect.objectContaining({ errors: { password: [expect.any(String)] } }),
    });
  });

  it('should return the user of a valid access token, without credentials', () => {
    expect(getUser(login().access_token)).toEqual({
      status: 200,
      body: expect.objectContaining({ id: 1, name: 'ng-scaffold', roles: ['ADMIN'] }),
    });
    expect(getUser(login().access_token)?.body).not.toHaveProperty('password');
  });

  it('should reject a missing, expired or refresh token on /user', () => {
    const tokens = login();

    expect(getUser('')?.status).toBe(401);
    expect(getUser(tokens.access_token, NOW + MOCK_ACCESS_TOKEN_TTL * 1000)?.status).toBe(401);
    expect(getUser(tokens.refresh_token ?? '')?.status).toBe(401);
  });

  it('should issue new tokens for a refresh token only', () => {
    const tokens = login();

    expect(post('/auth/refresh', { refresh_token: tokens.refresh_token })?.status).toBe(200);
    expect(post('/auth/refresh', { refresh_token: tokens.access_token })?.status).toBe(401);
  });

  it('should register a new guest account and refuse a taken username', () => {
    const created = post('/auth/register', { username: 'grace', password: 'pw' });

    expect(created?.status).toBe(201);
    expect(getUser((created?.body as TokenResponse).access_token)?.body).toEqual(
      expect.objectContaining({ name: 'grace', roles: ['GUEST'] })
    );
    expect(post('/auth/register', { username: 'grace', password: 'pw' })?.status).toBe(422);
  });

  it('should leave unknown routes to the network', () => {
    expect(backend.handle(new HttpRequest('GET', '/orders'), '/orders')).toBeUndefined();
  });

  it('should update the profile of the signed-in account and validate it', () => {
    const token = login().access_token;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const patch = (body: unknown) =>
      backend.handle(new HttpRequest('PATCH', '/user', body, { headers }), '/user', NOW);

    expect(patch({ name: ' ', email: 'nope' })).toEqual({
      status: 422,
      body: expect.objectContaining({
        errors: { name: [expect.any(String)], email: [expect.any(String)] },
      }),
    });
    expect(patch({ name: 'Ada', email: 'ada@example.com' })?.body).toEqual(
      expect.objectContaining({ name: 'Ada', email: 'ada@example.com' })
    );
    expect(getUser(token)?.body).toEqual(expect.objectContaining({ name: 'Ada' }));
  });
});

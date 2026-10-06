/**
 * Unit tests for `TokenStore`.
 *
 * How this file was built:
 *   1. `yarn ng g service core/auth/token-store` generated the "should be created" test.
 *   2. Added tests for the storage area chosen by "remember me", restoring (valid, expired,
 *      refreshable, malformed), clearing, `refreshAt` and the expiry of a token that cannot be
 *      refreshed; then for sessions (`set()` vs `renew()`). Vitest's fake timers also fake `Date.now()`; `TestBed.tick()` runs effects.
 */
import { TestBed } from '@angular/core/testing';
import { encodeBase64Url } from './auth-token';
import { TOKEN_STORAGE_KEY, TokenStore } from './token-store';

const NOW = Date.UTC(2026, 0, 1);

function create(): TokenStore {
  TestBed.resetTestingModule();
  const store = TestBed.inject(TokenStore);
  TestBed.tick();
  return store;
}

function stored(area: Storage): unknown {
  const raw = area.getItem(TOKEN_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

describe('TokenStore', () => {
  beforeEach(() => {
    // Start from empty storage whatever ran before in this worker.
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should start signed out', () => {
    expect(create().token()).toBeNull();
  });

  it('should keep a remembered token in localStorage and restore it after a restart', () => {
    create().set({ access_token: 'abc', expires_in: 60 }, true);

    expect(stored(localStorage)).toEqual({
      access_token: 'abc',
      token_type: 'bearer',
      exp: NOW / 1000 + 60,
    });
    expect(stored(sessionStorage)).toBeNull();

    const restored = create();
    expect(restored.token()?.accessToken).toBe('abc');
    expect(restored.remember).toBe(true);
  });

  it('should keep a token in sessionStorage without "remember me" and empty the other area', () => {
    const store = create();
    store.set({ access_token: 'first' }, true);

    store.set({ access_token: 'second' }, false);

    expect(stored(localStorage)).toBeNull();
    expect(stored(sessionStorage)).toEqual({ access_token: 'second', token_type: 'bearer' });
    expect(create().remember).toBe(false);
  });

  it('should keep the storage area and the session when a refresh renews the token', () => {
    const store = create();
    store.set({ access_token: 'login', refresh_token: 'r', expires_in: 60 }, true);
    const session = store.session();

    store.renew({ access_token: 'refreshed', refresh_token: 'r2', expires_in: 60 });

    expect(stored(localStorage)).toMatchObject({ access_token: 'refreshed' });
    expect(store.session()).toBe(session);
  });

  it('should start a new session on every set() and have none while signed out', () => {
    const store = create();
    expect(store.session()).toBeUndefined();

    store.set({ access_token: 'ada' }, false);
    const first = store.session();
    store.set({ access_token: 'eve' }, false);

    expect(first).toBeDefined();
    expect(store.session()).not.toBe(first);
    store.clear();
    expect(store.session()).toBeUndefined();
  });

  it('should drop a stored token that expired and cannot be refreshed', () => {
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ access_token: 'old', token_type: 'bearer', exp: NOW / 1000 - 1 })
    );

    expect(create().token()).toBeNull();
    expect(stored(localStorage)).toBeNull();
  });

  it('should restore an expired token that can still be refreshed', () => {
    sessionStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({
        access_token: 'old',
        token_type: 'bearer',
        refresh_token: 'r',
        exp: NOW / 1000 - 1,
      })
    );

    const store = create();

    expect(store.token()?.refreshToken).toBe('r');
    expect(store.refreshAt()).toBeLessThan(NOW);
  });

  it('should ignore stored values of the wrong shape or without an access token', () => {
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ access_token: '', token_type: 'bearer', refresh_token: 'r' })
    );
    sessionStorage.setItem(TOKEN_STORAGE_KEY, '"just a string"');

    expect(create().token()).toBeNull();
  });

  it('should forget the token in both areas on clear()', () => {
    const store = create();
    store.set({ access_token: 'abc' }, true);

    store.clear();

    expect(store.token()).toBeNull();
    expect(stored(localStorage)).toBeNull();
    expect(stored(sessionStorage)).toBeNull();
  });

  it('should clear a token that cannot be refreshed when it expires', () => {
    const store = create();
    store.set({ access_token: 'abc', expires_in: 60 }, false);
    TestBed.tick();

    vi.advanceTimersByTime(59_999);
    expect(store.token()).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(store.token()).toBeNull();
  });

  it('should leave a refreshable token to AuthStore and expose when to refresh it', () => {
    const store = create();
    const exp = NOW / 1000 + 60;
    const access = [{ alg: 'none' }, { exp }].map(part => encodeBase64Url(JSON.stringify(part)));
    store.set({ access_token: `${access.join('.')}.`, refresh_token: 'r' }, false);
    TestBed.tick();

    expect(store.refreshAt()).toBe(NOW + 55_000);
    vi.advanceTimersByTime(120_000);
    expect(store.token()).not.toBeNull();
  });
});

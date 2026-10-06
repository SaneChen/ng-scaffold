/**
 * Holds the signed-in user's access token, persists it and removes it when it expires.
 *
 * How this file was built:
 *   1. `yarn ng g service core/auth/token-store` generated an empty `@Service()` class and its
 *      spec.
 *   2. Added the private writable `#token` signal (an immutable `AuthToken` or `null`) with the
 *      read-only `token` view, and the `set(response, remember)` / `clear()` intent methods.
 *   3. Persistence: with "remember me" the token goes to `LocalStorage` (survives restarts),
 *      otherwise to `SessionStorage` (ends with the tab); the other area is always emptied.
 *      Start-up restores from either area and drops a token that expired and cannot be refreshed.
 *   4. `refreshAt` (computed) tells `AuthStore` when to renew a refreshable token. An `effect()`
 *      clears a token that cannot be refreshed at the moment it expires.
 *   5. `set()` starts a new sign-in session (`session` changes, so the user, roles and menu are
 *      loaded again even when another user signs in over an active session); `renew()` replaces
 *      the token of the current session (a refresh, nothing is reloaded). A stored token without
 *      an access token is not restored.
 *
 * Why: everything that depends on the sign-in state (`AuthStore.isAuthenticated`, guards, the
 * token interceptor) reads one signal, so a login, a refresh, a 401 or an expiry propagates
 * without the `change()`/`refresh()` observables and the manual timer subscription of ng-matero's
 * `TokenService`. Invariant: `token()` is `null`, valid, or refreshable (and about to be renewed).
 */
import { computed, DestroyRef, effect, inject, Service, signal } from '@angular/core';
import { LocalStorage } from '../storage/local-storage';
import { SessionStorage } from '../storage/session-storage';
import { AuthToken, StoredToken, TokenResponse } from './auth-token';
import { scheduleAt } from './schedule-at';

/** Storage key of the persisted token (in localStorage or sessionStorage). */
export const TOKEN_STORAGE_KEY = 'ng-scaffold-token';

@Service()
export class TokenStore {
  readonly #localArea = inject(LocalStorage);
  readonly #sessionArea = inject(SessionStorage);

  #remember = false;
  readonly #token = signal<AuthToken | null>(this.#restore());

  readonly #sessionId = signal(0);

  /** The current token; `null` when signed out. */
  readonly token = this.#token.asReadonly();

  /**
   * Identifies the current sign-in: changes with every `set()` (login, sign-up), not with
   * `renew()` (refresh); `undefined` while signed out. Data of the signed-in user is keyed on it.
   */
  readonly session = computed(() => (this.#token() ? this.#sessionId() : undefined));

  /** When `AuthStore` must renew the token (ms since the epoch); `undefined` if it cannot. */
  readonly refreshAt = computed(() => this.#token()?.refreshAt);

  /** Whether the token is kept across browser restarts ("remember me"). */
  get remember(): boolean {
    return this.#remember;
  }

  constructor() {
    let cancel: (() => void) | undefined;
    effect(() => {
      cancel?.();
      cancel = undefined;
      const token = this.#token();
      if (token && !token.refreshable && token.expiresAt !== undefined) {
        cancel = scheduleAt(token.expiresAt, () => this.clear());
      }
    });
    inject(DestroyRef).onDestroy(() => cancel?.());
  }

  /** Starts a new session with the token of a login or sign-up response. */
  set(response: TokenResponse, remember: boolean): void {
    this.#remember = remember;
    this.#store(AuthToken.fromResponse(response));
    this.#sessionId.update(id => id + 1);
  }

  /** Replaces the token of the current session (refresh) in the storage area chosen at login. */
  renew(response: TokenResponse): void {
    this.#store(AuthToken.fromResponse(response));
  }

  #store(token: AuthToken): void {
    (this.#remember ? this.#localArea : this.#sessionArea).set(TOKEN_STORAGE_KEY, token);
    (this.#remember ? this.#sessionArea : this.#localArea).remove(TOKEN_STORAGE_KEY);
    this.#token.set(token);
  }

  /** Forgets the token (sign-out, rejected token, expiry). */
  clear(): void {
    this.#localArea.remove(TOKEN_STORAGE_KEY);
    this.#sessionArea.remove(TOKEN_STORAGE_KEY);
    this.#token.set(null);
  }

  #restore(): AuthToken | null {
    const local = parse(this.#localArea.get<unknown>(TOKEN_STORAGE_KEY, null));
    const token = local ?? parse(this.#sessionArea.get<unknown>(TOKEN_STORAGE_KEY, null));
    this.#remember = local !== null;
    if (token && (token.valid() || token.refreshable)) {
      return token;
    }
    this.#localArea.remove(TOKEN_STORAGE_KEY);
    this.#sessionArea.remove(TOKEN_STORAGE_KEY);
    return null;
  }
}

/** Storage is outside the type system: accept only the shape `AuthToken.toJSON()` writes. */
function parse(stored: unknown): AuthToken | null {
  if (typeof stored !== 'object' || stored === null) {
    return null;
  }
  const { access_token, token_type, refresh_token, exp } = stored as Partial<StoredToken>;
  if (
    typeof access_token !== 'string' ||
    access_token === '' ||
    typeof token_type !== 'string' ||
    !['string', 'undefined'].includes(typeof refresh_token) ||
    !['number', 'undefined'].includes(typeof exp)
  ) {
    return null;
  }
  return new AuthToken({ access_token, token_type, refresh_token, exp });
}

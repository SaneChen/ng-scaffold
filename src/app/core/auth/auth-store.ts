/**
 * Sign-in state of the application: who is signed in, and the intents login, sign-up, refresh and
 * logout.
 *
 * How this file was built:
 *   1. `yarn ng g service core/auth/auth-store` generated an empty `@Service()` class and its spec.
 *   2. Added `isAuthenticated` (computed from `TokenStore.token`) and `user`, an `rxResource` keyed
 *      on `TokenStore.session`: it loads `GET /user` for every new sign-in (also when another user
 *      signs in over an active session), empties on sign-out, and a token refresh does not reload
 *      it.
 *   3. Added `login()`, `register()`, `refresh()` and `logout()`, which return promises so forms
 *      can `await` them (Signal Forms' `submit()` takes an async action).
 *   4. Added two effects: one renews a refreshable token at `TokenStore.refreshAt` (at most every
 *      `MIN_REFRESH_INTERVAL_MS`, so a server that issues very short-lived tokens cannot cause a
 *      refresh loop), the other
 *      sends the user to the login page whenever the state turns unauthenticated (logout, a 401,
 *      an expired or unrenewable token); except after an explicit logout, the page to return to
 *      is kept in `returnUrl`.
 *   5. A refresh only stores its result if the token it renewed is still the current one, so a
 *      logout or a new login during the request is never undone.
 *   6. Added `updateProfile()`, which saves the profile and replaces the loaded user with the
 *      server's answer (no reload), unless the session changed during the request.
 *
 * Why: ng-matero chained `TokenService.change()`, `refresh()` and a `BehaviorSubject` of the user
 * through `switchMap`s, and navigated from the token interceptor and the user menu. Here the token
 * signal is the single trigger: everything else derives from it, and the redirect lives in one
 * place.
 */
import { computed, effect, inject, Service, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoginApi, ProfileData, RegistrationData } from './login-api';
import { scheduleAt } from './schedule-at';
import { TokenStore } from './token-store';
import { User } from './user';

/** Route of the login page; `authGuard` and the sign-out redirect send users there. */
export const LOGIN_URL = '/auth/login';

/** Minimum time between two scheduled refreshes. */
export const MIN_REFRESH_INTERVAL_MS = 10_000;

@Service()
export class AuthStore {
  readonly #tokens = inject(TokenStore);
  readonly #api = inject(LoginApi);
  readonly #router = inject(Router);

  #refreshing: Promise<void> | null = null;
  #lastRefresh = Number.NEGATIVE_INFINITY;
  /** Set by `logout()`, read and reset by the redirect effect (effects run asynchronously). */
  #loggedOut = false;

  /** Whether a user is signed in (a token is held). */
  readonly isAuthenticated = computed(() => this.#tokens.token() !== null);

  readonly #user = rxResource<User, number | undefined>({
    params: () => this.#tokens.session(),
    stream: () => this.#api.user(),
  });

  /** The signed-in user once `GET /user` has answered; `null` while signed out or loading. */
  readonly user = computed(() => (this.#user.hasValue() ? this.#user.value() : null));

  /** Whether `GET /user` is in flight. */
  readonly userLoading = this.#user.isLoading;

  /** The error of the last `GET /user`, if it failed. */
  readonly userError = this.#user.error;

  constructor() {
    effect(onCleanup => {
      // Track the token itself: a renewed token may expire in the same second as the old one.
      const refreshAt = this.#tokens.token()?.refreshAt;
      if (refreshAt !== undefined) {
        const at = Math.max(refreshAt, this.#lastRefresh + MIN_REFRESH_INTERVAL_MS);
        onCleanup(scheduleAt(at, () => void this.refresh()));
      }
    });

    let wasAuthenticated = untracked(this.isAuthenticated);
    effect(() => {
      const authenticated = this.isAuthenticated();
      if (wasAuthenticated && !authenticated) {
        untracked(() => this.#redirectToLogin(this.#loggedOut));
      }
      this.#loggedOut = false;
      wasAuthenticated = authenticated;
    });
  }

  /** Signs in; rejects with the `HttpErrorResponse` of a refused login (e.g. 422). */
  async login(username: string, password: string, rememberMe = false): Promise<void> {
    const response = await firstValueFrom(this.#api.login({ username, password, rememberMe }));
    this.#tokens.set(response, rememberMe);
  }

  /** Creates an account and signs it in for this browser session. */
  async register(data: RegistrationData): Promise<void> {
    this.#tokens.set(await firstValueFrom(this.#api.register(data)), false);
  }

  /** Saves the signed-in user's name and email; rejects with the `HttpErrorResponse` if refused. */
  async updateProfile(data: ProfileData): Promise<void> {
    const session = this.#tokens.session();
    const user = await firstValueFrom(this.#api.updateUser(data));
    // A logout or another sign-in during the request owns the user now.
    if (this.#tokens.session() === session) {
      this.#user.set(user);
    }
  }

  /** Renews the token with its refresh token; a refused refresh signs the user out. */
  refresh(): Promise<void> {
    this.#refreshing ??= this.#refresh().finally(() => (this.#refreshing = null));
    return this.#refreshing;
  }

  /** Signs out on the server (best effort) and locally, then shows the login page. */
  async logout(): Promise<void> {
    // Before the request: a 401 answer clears the token before `finally` runs.
    this.#loggedOut = this.isAuthenticated();
    try {
      await firstValueFrom(this.#api.logout());
    } catch {
      // The local sign-out below must happen even when the server cannot be reached.
    } finally {
      this.#tokens.clear();
    }
  }

  async #refresh(): Promise<void> {
    const renewed = this.#tokens.token();
    if (renewed?.refreshToken === undefined) {
      return;
    }
    this.#lastRefresh = Date.now();
    try {
      const response = await firstValueFrom(this.#api.refresh(renewed.refreshToken));
      if (this.#tokens.token() === renewed) {
        this.#tokens.renew(response);
      }
    } catch {
      if (this.#tokens.token() === renewed) {
        this.#tokens.clear();
      }
    }
  }

  #redirectToLogin(loggedOut: boolean): void {
    const current = this.#router.url;
    const returnUrl = loggedOut || current.startsWith(LOGIN_URL) ? undefined : current;
    void this.#router.navigate([LOGIN_URL], { queryParams: returnUrl ? { returnUrl } : {} });
  }
}

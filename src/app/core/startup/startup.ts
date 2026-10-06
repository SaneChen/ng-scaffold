/**
 * `Startup.ready()`: resolves once the signed-in user's data (user, roles, menu) has loaded.
 *
 * How this file was built:
 *   1. `yarn ng g service core/startup/startup` generated an empty `@Service()` class and its
 *      spec.
 *   2. Added `settled` (computed): signed out, or `GET /user` and `GET /user/menu` no longer in
 *      flight. `AuthStore`, `PermissionStore` and `MenuStore` load and clear that data by
 *      themselves whenever the sign-in state changes; this service only tells when it is there.
 *   3. Added `ready()`, a promise of `settled`, awaited by the app initializer (app.config.ts) and
 *      by `permissionGuard`. Concurrent calls share one pending promise, and it resolves after
 *      `STARTUP_TIMEOUT_MS` at the latest: a backend that never answers must not keep the start-up
 *      loader up forever (the app then starts without the menu and roles).
 *
 * Why: ng-matero's `StartupService` subscribed to the auth changes once, pushed the menu and a
 * hard-coded permission list into their services, and only the first load was awaited. Here the
 * data derives from the token signal, so a later login, a refresh or a sign-out keeps it right;
 * waiting matters for the first page (rendered with the menu and roles in place) and for guards
 * that check roles right after a login.
 */
import { computed, effect, inject, Injector, Service, untracked } from '@angular/core';
import { AuthStore } from '../auth/auth-store';
import { MenuStore } from '../menu/menu-store';
import { PermissionStore } from '../permissions/permission-store';

/** Longest time `ready()` waits for the user's data, in milliseconds. */
export const STARTUP_TIMEOUT_MS = 10_000;

@Service()
export class Startup {
  readonly #injector = inject(Injector);
  readonly #auth = inject(AuthStore);
  readonly #menu = inject(MenuStore);
  #pending: Promise<void> | null = null;

  /** Whether nothing is pending: signed out, or the user and the menu have loaded (or failed). */
  readonly settled = computed(
    () => !this.#auth.isAuthenticated() || (!this.#auth.userLoading() && !this.#menu.loading())
  );

  constructor() {
    // Create the store now, so the roles of a restored session are derived before any guard runs.
    inject(PermissionStore);
  }

  /**
   * Resolves when `settled` is true (at once if it already is), or after `STARTUP_TIMEOUT_MS`;
   * never rejects.
   */
  ready(): Promise<void> {
    if (untracked(this.settled)) {
      return Promise.resolve();
    }
    this.#pending ??= new Promise<void>(resolve => {
      const done = () => {
        clearTimeout(timer);
        watcher.destroy();
        this.#pending = null;
        resolve();
      };
      const timer = setTimeout(done, STARTUP_TIMEOUT_MS);
      const watcher = effect(
        () => {
          if (this.settled()) {
            done();
          }
        },
        { injector: this.#injector, manualCleanup: true }
      );
    });
    return this.#pending;
  }
}

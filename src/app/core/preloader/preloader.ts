/**
 * Removes the start-up loader of `src/index.html` (`#globalLoader`) once the first page has
 * rendered.
 *
 * How this file was built:
 *   1. `yarn ng g service core/preloader/preloader` generated an empty `@Service()` class and its
 *      spec.
 *   2. Added `hide()`: it adds the `global-loader-fade-out` class (an opacity transition defined
 *      by the inline styles of index.html), then removes the element on `transitionend` — or after
 *      a timeout, because `transitionend` never fires when the transition is disabled (reduced
 *      motion) or the tab is in the background.
 *   3. Added `hideAfterFirstNavigation()`: it waits until the router's first navigation has
 *      settled, then calls `hide()` from `afterNextRender()`, once Angular has rendered the page.
 *   4. `App` calls `hideAfterFirstNavigation()` from its constructor.
 *
 * Why: the loader is plain HTML so it paints before any JavaScript has downloaded. Every page is
 * lazy loaded and the router starts the first navigation only after the root component exists, so
 * App's own first render is an empty shell: hiding the loader then would show a blank page while
 * the first page chunk downloads. A navigation has settled when it ends, is skipped, fails, or is
 * cancelled for good; a cancellation caused by a guard redirect (e.g. to the login page) or by a
 * newer navigation does not count, because another navigation follows. This is the rule the
 * router itself applies to `withEnabledBlockingInitialNavigation()`. Removing the loader (instead
 * of only hiding it, as ng-matero did) also removes its `role="status"` live region, so screen
 * readers stop announcing "Loading" once the application is ready.
 */
import { afterNextRender, DestroyRef, DOCUMENT, inject, Injector, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Event,
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
} from '@angular/router';
import { filter, take } from 'rxjs';

/** Id of the loader element in src/index.html. */
export const PRELOADER_ID = 'globalLoader';

/** Slightly longer than the 300 ms fade of index.html. */
const REMOVE_TIMEOUT_MS = 500;

@Service()
export class Preloader {
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #destroyRef = inject(DestroyRef);
  readonly #router = inject(Router);

  /**
   * Hides the loader once the first navigation has settled and its page has rendered. Call it
   * before that navigation starts, e.g. from the root component's constructor (`provideRouter()`
   * starts the initial navigation after the root component has been created).
   */
  hideAfterFirstNavigation(): void {
    const hideAfterRender = () => afterNextRender(() => this.hide(), { injector: this.#injector });
    // Already settled, e.g. with `withEnabledBlockingInitialNavigation()`.
    if (this.#router.navigated) {
      hideAfterRender();
      return;
    }
    this.#router.events
      .pipe(filter(isSettled), take(1), takeUntilDestroyed(this.#destroyRef))
      .subscribe(hideAfterRender);
  }

  /** Fades the loader out and removes it from the DOM. Safe to call more than once. */
  hide(): void {
    const loader = this.#document.getElementById(PRELOADER_ID);
    if (!loader || loader.classList.contains('global-loader-fade-out')) {
      return;
    }
    const remove = () => loader.remove();
    loader.addEventListener('transitionend', remove, { once: true });
    this.#document.defaultView?.setTimeout(remove, REMOVE_TIMEOUT_MS);
    loader.classList.add('global-loader-fade-out');
  }
}

/** Whether `event` ends a navigation that no other navigation automatically follows. */
function isSettled(event: Event): boolean {
  if (event instanceof NavigationCancel) {
    return (
      event.code !== NavigationCancellationCode.Redirect &&
      event.code !== NavigationCancellationCode.SupersededByNewNavigation
    );
  }
  return (
    event instanceof NavigationEnd ||
    event instanceof NavigationSkipped ||
    event instanceof NavigationError
  );
}

/**
 * `injectMenuTrail()`: the menu items leading to the current page, as a signal.
 *
 * How this file was built: written by hand (a plain function; Angular CLI has no generator for
 * injection helpers).
 *
 * Why: `Breadcrumb` and `PageHeader` both need the trail. `Router.lastSuccessfulNavigation` is a
 * signal, so reading it re-evaluates the trail after every navigation (also those with
 * `skipLocationChange`, such as the error pages) without subscribing to router events.
 */
import { computed, inject, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, MenuStore } from '@core';

/** Must be called in an injection context (field initializer or constructor). */
export function injectMenuTrail(): Signal<MenuItem[]> {
  const router = inject(Router);
  const menu = inject(MenuStore);
  return computed(() => {
    router.lastSuccessfulNavigation();
    return menu.trail(router.url);
  });
}

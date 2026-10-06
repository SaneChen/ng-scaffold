/**
 * `authGuard`: lets only signed-in users into the routes it protects.
 *
 * How this file was built:
 *   1. `yarn ng g guard core/auth/auth --implements CanMatch` generated a functional `CanMatchFn`
 *      and its spec (the CLI accepts one interface per functional guard).
 *   2. Typed it as `CanMatchFn & CanActivateChildFn` and made it ignore its arguments, so the same
 *      function serves `canMatch` (lazy routes are not even downloaded) and `canActivateChild`
 *      (re-checked on every child navigation, e.g. after the token expired).
 *   3. Signed-out users are redirected to `/auth/login?returnUrl=<requested URL>`.
 *
 * Why: ng-matero's guard redirected to the login page without remembering the requested page.
 */
import { inject } from '@angular/core';
import { CanActivateChildFn, CanMatchFn, Router } from '@angular/router';
import { AuthStore, LOGIN_URL } from './auth-store';

export const authGuard: CanMatchFn & CanActivateChildFn = () => {
  if (inject(AuthStore).isAuthenticated()) {
    return true;
  }
  const router = inject(Router);
  const target = router.currentNavigation()?.extractedUrl;
  const returnUrl = target ? router.serializeUrl(target) : '/';
  return router.createUrlTree([LOGIN_URL], {
    queryParams: returnUrl === '/' ? {} : { returnUrl },
  });
};

/**
 * `permissionGuard`: lets users into a route only if they pass `route.data['permissions']`.
 *
 * How this file was built:
 *   1. `yarn ng g guard core/permissions/permission --implements CanMatch` generated a functional
 *      `CanMatchFn` and its spec.
 *   2. Typed it as `CanMatchFn & CanActivateFn`: it only reads `route.data`, which both kinds of
 *      route objects have.
 *   3. Reads a `PermissionRule` plus an optional `redirectTo` from the route data (ngx-permissions'
 *      format); users who do not pass are redirected there, or to `/403`.
 *
 * Why: replaces `ngxPermissionsGuard` with a function over `PermissionStore`. As `canMatch` it
 * also keeps the lazy chunk of a forbidden route from being downloaded.
 */
import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Data, Router } from '@angular/router';
import { PermissionRule, PermissionStore } from './permission-store';

/** The `data.permissions` entry of a guarded route. */
export interface RoutePermissions extends PermissionRule {
  /** Where to send users who do not pass; `/403` by default. */
  redirectTo?: string;
}

export const permissionGuard: CanMatchFn & CanActivateFn = (route: { data?: Data }) => {
  const rule = route.data?.['permissions'] as RoutePermissions | undefined;
  if (inject(PermissionStore).has(rule)) {
    return true;
  }
  return inject(Router).parseUrl(rule?.redirectTo ?? '/403');
};

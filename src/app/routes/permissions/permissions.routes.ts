/**
 * Routes of the permissions demo area (`/permissions/...`), lazy loaded by app.routes.ts.
 *
 * How this file was built: written by hand (Angular CLI has no generator for route files);
 * `export default`, demo translations as in every demo area.
 *
 * Why: the route-guard and test pages are protected by `permissionGuard` as `canMatch`, with
 * ng-matero's rules (no GUEST; ADMIN only) and its redirect to the dashboard. As `canMatch` the
 * guard runs on every navigation to the page, also the one the role switcher triggers.
 */
import { Routes } from '@angular/router';
import { permissionGuard, RoutePermissions } from '@core';
import { demoTranslationsReady, provideDemoTranslations } from '../demo/demo-translations';

const routes: Routes = [
  {
    path: '',
    providers: provideDemoTranslations(),
    canActivate: [demoTranslationsReady],
    children: [
      {
        path: 'role-switching',
        title: 'menu.permissions.role-switching',
        loadComponent: () =>
          import('./role-switching/role-switching').then(m => m.PermissionsRoleSwitching),
      },
      {
        path: 'route-guard',
        title: 'menu.permissions.route-guard',
        canMatch: [permissionGuard],
        data: {
          permissions: { except: 'GUEST', redirectTo: '/dashboard' } satisfies RoutePermissions,
        },
        loadComponent: () => import('./route-guard/route-guard').then(m => m.PermissionsRouteGuard),
      },
      {
        path: 'test',
        title: 'menu.permissions.test',
        canMatch: [permissionGuard],
        data: {
          permissions: { only: 'ADMIN', redirectTo: '/dashboard' } satisfies RoutePermissions,
        },
        loadComponent: () => import('./test/test').then(m => m.PermissionsTest),
      },
    ],
  },
];

export default routes;

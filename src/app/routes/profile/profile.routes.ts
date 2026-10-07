/**
 * Routes of the profile area (`/profile/...`), lazy loaded by app.routes.ts.
 *
 * How this file was built: written by hand (Angular CLI has no generator for route files);
 * `export default` so `loadChildren: () => import(...)` needs no `.then()`.
 *
 * Why: ng-matero's user menu linked to these pages, but its `ng add` schematic did not ship them;
 * they are part of the starter here.
 */
import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.ProfileLayout),
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        title: 'menu.profile.overview',
        loadComponent: () => import('./overview/overview').then(m => m.ProfileOverview),
      },
      {
        path: 'settings',
        title: 'menu.profile.settings',
        loadComponent: () => import('./settings/settings').then(m => m.ProfileSettings),
      },
    ],
  },
];

export default routes;

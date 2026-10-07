import { Routes } from '@angular/router';
// [ng-scaffold] Step 1: signed-in pages live in the admin layout; sign-in pages in the auth layout.
import { authGuard } from '@core';

export const routes: Routes = [
  // [ng-scaffold] Step 1: both layouts are lazy loaded; `authGuard` keeps signed-out users (and
  // the layout's code) away from the admin area and re-checks every child navigation. The auth
  // layout comes first: the empty path of the admin layout matches every URL, so its guard would
  // otherwise send `/auth/login` back to `/auth/login` forever.
  {
    path: 'auth',
    loadComponent: () => import('@theme/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: [
      // [ng-scaffold] Step 3: sign-in pages.
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        title: 'login',
        loadComponent: () => import('./routes/sessions/login/login').then(m => m.Login),
      },
      {
        path: 'signup',
        title: 'signup',
        loadComponent: () => import('./routes/sessions/signup/signup').then(m => m.Signup),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('@theme/admin-layout/admin-layout').then(m => m.AdminLayout),
    canMatch: [authGuard],
    canActivateChild: [authGuard],
    children: [
      // [ng-scaffold] Step 2: error pages (also shown by `permissionGuard` and failed GETs).
      {
        path: '403',
        title: 'error.403.title',
        loadComponent: () => import('./routes/sessions/error-403').then(m => m.Error403),
      },
      {
        path: '404',
        title: 'error.404.title',
        loadComponent: () => import('./routes/sessions/error-404').then(m => m.Error404),
      },
      {
        path: '500',
        title: 'error.500.title',
        loadComponent: () => import('./routes/sessions/error-500').then(m => m.Error500),
      },
    ],
  },
];

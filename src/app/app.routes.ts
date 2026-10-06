import { Routes } from '@angular/router';
// [ng-scaffold] Step 1: signed-in pages live in the admin layout; sign-in pages in the auth layout.
import { authGuard } from '@core';

export const routes: Routes = [
  // [ng-scaffold] Step 1: both layouts are lazy loaded; `authGuard` keeps signed-out users (and
  // the layout's code) away from the admin area and re-checks every child navigation.
  {
    path: '',
    loadComponent: () => import('@theme/admin-layout/admin-layout').then(m => m.AdminLayout),
    canMatch: [authGuard],
    canActivateChild: [authGuard],
    children: [],
  },
  {
    path: 'auth',
    loadComponent: () => import('@theme/auth-layout/auth-layout').then(m => m.AuthLayout),
    children: [],
  },
];

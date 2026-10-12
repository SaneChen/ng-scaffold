/**
 * Lazy tab page and weather subroutes; no CLI generator exists for route files.
 * The empty child redirects to the sunny tab; every child loads its content on demand.
 */
import { Routes } from '@angular/router';

export const WEATHER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sunny-tab' },
  ...['sunny', 'rainy', 'foggy'].map(weather => ({
    path: weather + '-tab',
    data: { weather },
    loadComponent: () => import('./weather').then(m => m.MaterialWeather),
  })),
];

export default [
  {
    path: '',
    title: 'menu.material.layout.tab',
    loadComponent: () => import('./tab').then(m => m.MaterialTab),
    children: WEATHER_ROUTES,
  },
] satisfies Routes;

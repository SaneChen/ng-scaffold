/**
 * Route of the remote-data demo (`/tables/remote-data`), with the simulated server.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 * `provideHttpClient(withInterceptors([demoReposInterceptor]), withRequestsMadeViaParent())`
 * gives the page its own `HttpClient`: the demo interceptor answers the search first, and every
 * other request continues through the app's interceptors and backend.
 */
import {
  provideHttpClient,
  withInterceptors,
  withRequestsMadeViaParent,
} from '@angular/common/http';
import { Routes } from '@angular/router';
import { demoReposInterceptor } from './demo-repos-interceptor';

const routes: Routes = [
  {
    path: '',
    title: 'menu.tables.remote-data',
    providers: [
      provideHttpClient(withInterceptors([demoReposInterceptor]), withRequestsMadeViaParent()),
    ],
    loadComponent: () => import('./remote-data').then(m => m.TablesRemoteData),
  },
];

export default routes;

/**
 * Routes of the tables demo area (`/tables/...`), below the demo translations.
 *
 * How this file was built: written by hand (no generator for route files); `export default`.
 * The remote-data page has its own route file for its route-level `HttpClient`.
 */
import { Routes } from '@angular/router';
import { demoTranslationsReady, provideDemoTranslations } from '../demo/demo-translations';

const routes: Routes = [
  {
    path: '',
    providers: provideDemoTranslations(),
    canActivate: [demoTranslationsReady],
    children: [
      {
        path: 'kitchen-sink',
        title: 'menu.tables.kitchen-sink',
        loadComponent: () => import('./kitchen-sink/kitchen-sink').then(m => m.TablesKitchenSink),
      },
      { path: 'remote-data', loadChildren: () => import('./remote-data/remote-data.routes') },
    ],
  },
];

export default routes;

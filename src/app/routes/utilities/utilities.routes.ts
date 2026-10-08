/**
 * Routes of the utilities demo area (`/utilities/...`), lazy loaded by app.routes.ts.
 *
 * How this file was built: written by hand (Angular CLI has no generator for route files);
 * `export default`, demo translations as in every demo area.
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
        path: 'css-grid',
        title: 'menu.utilities.css-grid',
        loadComponent: () => import('./css-grid/css-grid').then(m => m.UtilitiesCssGrid),
      },
      {
        path: 'css-helpers',
        title: 'menu.utilities.css-helpers',
        loadComponent: () => import('./css-helpers/css-helpers').then(m => m.UtilitiesCssHelpers),
      },
    ],
  },
];

export default routes;

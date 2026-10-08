/**
 * Routes of the design demo area (`/design/...`), lazy loaded by app.routes.ts.
 *
 * How this file was built: written by hand (Angular CLI has no generator for route files);
 * `export default` so `loadChildren: () => import(...)` needs no `.then()`.
 *
 * Why: like every demo area, a componentless parent route provides the demo translations and
 * waits for them before the first page renders.
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
        path: 'colors',
        title: 'menu.design.colors',
        loadComponent: () => import('./colors/colors').then(m => m.DesignColors),
      },
      {
        path: 'icons',
        title: 'menu.design.icons',
        loadComponent: () => import('./icons/icons').then(m => m.DesignIcons),
      },
    ],
  },
];

export default routes;

/**
 * Routes of the menu-level demo area (`/menu-level/...`), lazy loaded by app.routes.ts.
 *
 * How this file was built: written by hand (Angular CLI has no generator for route files);
 * `export default`, demo translations as in every demo area. The three leaves of the demo menu
 * (public/data/menu.json) share one page; the groups between them are not pages.
 */
import { Routes } from '@angular/router';
import { demoTranslationsReady, provideDemoTranslations } from '../demo/demo-translations';

const page = () => import('./level/level').then(m => m.MenuLevelPage);

const routes: Routes = [
  {
    path: '',
    providers: provideDemoTranslations(),
    canActivate: [demoTranslationsReady],
    children: [
      {
        path: 'level-1-1/level-2-1/level-3-1/level-4-1',
        title: 'menu.menu-level.level-1-1.level-2-1.level-3-1.level-4-1',
        loadComponent: page,
      },
      {
        path: 'level-1-1/level-2-2',
        title: 'menu.menu-level.level-1-1.level-2-2',
        loadComponent: page,
      },
      { path: 'level-1-2', title: 'menu.menu-level.level-1-2', loadComponent: page },
    ],
  },
];

export default routes;

/**
 * Routes of the media demo area (`/media/...`), lazy loaded by app.routes.ts.
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
        path: 'gallery',
        title: 'menu.media.gallery',
        loadComponent: () => import('./gallery/gallery').then(m => m.MediaGallery),
      },
    ],
  },
];

export default routes;
